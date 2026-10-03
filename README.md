# JobPilot 🚀

> **Production-Quality, Open-Source AI-Powered Job Search & Application Assistant**

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16%20(React%2019)-black.svg)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://postgresql.org)
[![Alembic](https://img.shields.io/badge/Migrations-Alembic-red.svg)](https://alembic.sqlalchemy.org)
[![Playwright](https://img.shields.io/badge/Browser_Automation-Playwright-green.svg)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Problem & Motivation

Applying to software engineering and tech roles is notoriously repetitive: job seekers repeatedly copy and paste personal details, re-enter education and work histories, and answer common screening questions across dozens of applicant tracking systems (ATS).

At the same time, naive AI tools hallucinate skills or blindly submit hundreds of unverified applications, burning candidate reputation and flooding recruiters with low-signal spam.

**JobPilot** solves this by enforcing a **strict Human-in-the-Loop** pipeline with **transparent, explainable matching**:
1. It parses your real resume (PDF/DOCX) and builds a structured, editable career profile.
2. It discovers and normalizes legitimate job listings without fragile scraper bypasses.
3. It filters deterministically first (location, salary, roles), reserving AI for explainable semantic matching.
4. It prepares browser applications via Playwright, answers screening questions strictly grounded in your verified experience, and **pauses for your review before any submission**.
5. It tracks every application through full status lifecycle and provides job search analytics.

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │   Next.js 16 Web UI   │
                         │ (Dashboard, Profile) │
                         └──────────┬───────────┘
                                    │ HTTP / REST
                                    ▼
                         ┌──────────────────────┐
                         │   FastAPI Backend    │
                         │    (App Engine)      │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
      ┌───────────────┐    ┌────────────────┐    ┌────────────────┐
      │ Profile       │    │ Job Discovery  │    │ Application    │
      │ Service       │    │ Service        │    │ Service        │
      └───────┬───────┘    └───────┬────────┘    └───────┬────────┘
              │                    │                     │
              ▼                    ▼                     ▼
      ┌───────────────┐    ┌────────────────┐    ┌────────────────┐
      │ Resume Parser │    │ Job Normalizer │    │ Playwright     │
      │ (PDF/DOCX)    │    │ (Deduplication)│    │ Browser Agent  │
      └───────────────┘    └────────────────┘    └───────┬────────┘
                                                         │
                                                         ▼
                                                  Application Form
                                                         │
                                                         ▼
                                                [ Human Review ]
                                                         │
                                                         ▼
                                                  Submit & Track

                    ┌───────────────────────────┐
                    │        AI Service         │
                    │                           │
                    │   Ollama  /  OpenRouter   │
                    └─────────────┬─────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
          Resume Analysis    Job Matching    Grounded Q&A


                    ┌───────────────────────────┐
                    │        PostgreSQL         │
                    │                           │
                    │ users, profiles, resumes, │
                    │ jobs, job_matches, apps,  │
                    │ automation_logs           │
                    └───────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (React 19), TypeScript, Tailwind CSS v4, Lucide React (accessible SVG icons, zero emojis).
- **Backend:** FastAPI, Pydantic v2, Pydantic-Settings, SQLAlchemy 2.0 (psycopg2 / sqlite fallback), PyJWT, Bcrypt, PyPDF, Python-Docx.
- **Database & Migrations:** PostgreSQL 16, Alembic migrations (`20261003_0001`, `20261003_0002`).
- **Browser Automation:** Playwright async browser manager with `GenericFormAdapter` (DOM field extraction, deterministic profile mapping, and CAPTCHA challenge detection).
- **AI Abstraction:** Multi-provider interface supporting local Ollama (zero-cost dev) and OpenRouter.
- **DevOps:** Docker, Docker Compose, multi-stage container builds.

---

## 📂 Project Monorepo Structure

```text
jobpilot/
├── apps/
│   ├── web/                     # Next.js 16 (React 19) Dashboard & UI
│   │   ├── app/
│   │   │   ├── dashboard/       # Analytics & featured jobs
│   │   │   ├── jobs/            # Job discovery & search
│   │   │   │   └── [id]/        # Deep explainable match breakdown
│   │   │   ├── applications/    # Application pipeline & status tracker
│   │   │   │   └── [id]/        # Human-in-the-loop review & submit screen
│   │   │   ├── profile/         # Career overview profile
│   │   │   │   ├── resume/      # Resume upload & AI extraction
│   │   │   │   ├── preferences/ # Job preferences & deterministic filters
│   │   │   │   └── answers/     # Reusable answer bank & screening Q&A
│   │   │   ├── settings/        # System settings & runtime health
│   │   │   │   ├── ai/          # AI engine switcher (Ollama/OpenRouter/Mock)
│   │   │   │   └── integrations/# Job sources & Playwright automation guardrails
│   │   │   ├── login/           # Authentication
│   │   │   └── register/
│   │   ├── components/          # Reusable UI components, ProfileNav, SettingsNav & Navbar
│   │   └── lib/                 # Auth context, API client & TypeScript types
│   │
│   └── api/                     # FastAPI Backend Application
│       ├── alembic/             # Database migrations
│       ├── app/
│       │   ├── api/v1/          # REST Endpoints (auth, profile, resumes, jobs, applications, analytics, settings)
│       │   ├── agents/          # Specialized AI agents (ResumeAgent, JobMatchingAgent, QA Agent)
│       │   ├── automation/      # Playwright browser manager & generic form adapter
│       │   ├── jobs/            # Job sources (Remotive API, Mock source) & normalizer
│       │   ├── models/          # Relational models (User, Profile, Resume, Job, JobMatch, Application)
│       │   ├── providers/       # AI provider abstraction (Ollama, OpenRouter, Mock)
│       │   ├── schemas/         # Pydantic validation schemas
│       │   └── services/        # Business logic services
│       └── tests/               # Pytest suite with isolated test DB & mock forms
│
├── docker-compose.yml           # Local orchestration (PostgreSQL, Redis, API, Web)
├── .env.example                 # Configuration template
└── README.md
```


---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python:** 3.11+ (Python 3.13 tested)
- **Node.js:** 18+ (Node 20+ tested)

### 2. Clone and Configure
```bash
git clone https://github.com/adityashm/JobPilot.git
cd JobPilot
cp .env.example .env
```

### 3. Backend Setup
```bash
cd apps/api
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
OpenAPI documentation: `http://localhost:8000/docs`.

### 4. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```
Open browser at `http://localhost:3000`.

---

## 🧪 Testing

Run backend tests:
```bash
cd apps/api
python -m pytest
```

Test coverage includes (24 automated tests passing):
- **Health & Authentication:** User registration, password hashing, JWT token generation, unauthorized guards.
- **Profile & Answer Bank:** Profile CRUD, skill updates, career preferences, reusable answer bank.
- **Resume Parsing & Extraction:** Text extraction from PDF, DOCX, and TXT; AI structured extraction; automatic profile sync; resume file management and primary selection.
- **Job Discovery & Filtering:** Remotive public API and deterministic source discovery; URL normalization and deduplication; deterministic pre-filtering.
- **Explainable Matching:** Skill overlap intersection, experience evaluation, gap detection, grounded AI reasoning.
- **Playwright Automation:** Browser manager launch, DOM field extraction, profile field mapping, autofill against local mock application form, handling inputs with or without ID attributes, work auth mapping.
- **Question Answering & Grounding:** Grounded screening question answering with zero hallucination enforcement across relocation, salary, location, notice period, and socials.
- **Application Pipeline & Analytics:** Status transitions (`SAVED`, `REVIEW`, `READY`, `APPLIED`, `INTERVIEW`, `OFFER`), explicit human approval submission, funnel analytics.
- **System Settings:** Runtime AI provider switching (Ollama, OpenRouter, Mock), model configuration, active provider ping verification.

Run frontend build verification (16 routes compiled cleanly with 0 TypeScript/lint errors):
```bash
cd apps/web
npm run build
```


---

## 🗺️ Completed MVP Definition of Done

- [x] **1. User Authentication:** Registration, JWT login, and protected routes.
- [x] **2. Resume Upload & Parser:** PDF/DOCX/TXT text extraction and AI structured profile creation.
- [x] **3. Profile & Reusable Answers:** Target roles, verified skills, and reusable answer bank.
- [x] **4. Job Discovery & Normalization:** JobSource abstraction (Remotive & Mock), URL normalization, and deduplication.
- [x] **5. Explainable Fit Matching:** Grounded match score, strong matches, gaps, and transparent reasoning.
- [x] **6. Application Pipeline:** Full status lifecycle (`SAVED`, `REVIEW`, `READY`, `APPLIED`, `INTERVIEW`, `OFFER`).
- [x] **7. Playwright Browser Automation:** Form field extraction, profile mapping, and autofill against mock form.
- [x] **8. Grounded AI Q&A:** Truthful screening answers strictly grounded in candidate profile.
- [x] **9. Human-in-the-Loop Review:** Dedicated approval screen with editable answers before final submission.
- [x] **10. Analytics Dashboard:** Discovered jobs, match count, application status breakdown, and response rates.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

# JobPilot System Architecture

JobPilot is a production-grade, human-in-the-loop AI-powered job search and application assistant designed with modular services, deterministic filters, provider abstractions, and resilient browser automation.

## 1. High-Level Flow

```text
Discover (APIs / RSS / Public Boards)
   ↓
Filter (Deterministic code: location, salary, keywords, duplicates)
   ↓
Understand (Structured resume parsing, candidate profile)
   ↓
Match (Explainable criteria, transparent score breakdowns)
   ↓
Recommend (Prioritized candidate dashboard)
   ↓
Prepare application (Playwright Form Adapter + Grounded Q&A)
   ↓
Human review (Mandatory candidate approval)
   ↓
Submit (Explicit user confirmation)
   ↓
Track (Status pipeline & analytics)
```

## 2. Core Modules

1. **Authentication & Profile Service**:
   - Manages users, JWT credentials, and comprehensive structured profiles.
   - Grounded truth constraint: The system NEVER claims skills or experience not verified in candidate profile.

2. **AI Provider Abstraction (`apps/api/app/providers`)**:
   - `BaseAIProvider`: Abstract interface for LLM completions and structured JSON schema output.
   - `OllamaProvider`: Local offline LLM execution (default: zero cost).
   - `OpenRouterProvider`: Multi-model cloud gateway.
   - `MockAIProvider`: Offline test harness.

3. **Domain Agents (`apps/api/app/agents`)**:
   - `ResumeAgent`: Extracts structured career entities from PDF/DOCX resumes.
   - `JobDiscoveryAgent`: Pulls and normalizes listings from verified job sources.
   - `JobMatchingAgent`: Computes transparent, explainable compatibility.
   - `ApplicationAgent`: Orchestrates browser automation and human checkpoints.

4. **Browser Automation (`apps/api/app/automation`)**:
   - Isolated from FastAPI route handlers.
   - Adapters for generic web forms and specific ATS platforms (Greenhouse, Lever).
   - Pauses on CAPTCHA / 2FA / unknown security barriers for human takeover.

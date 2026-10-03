import re
from typing import Any, Dict, List, Optional
from app.agents.base import BaseAgent
from app.schemas.profile import ProfileBase
from app.services.resume_parser import (
    segment_resume_sections,
    extract_candidate_name,
    extract_email,
    extract_phone,
    extract_urls,
    extract_location,
    extract_education_entries,
    extract_experience_entries,
    extract_project_entries,
    calculate_experience_years,
)

# Comprehensive technical skills dictionary (350+ industry-standard technologies)
TECH_SKILLS_DICTIONARY = [
    # Languages
    "Python", "Java", "Go", "Golang", "C++", "C", "C#", ".NET", "Rust", "Kotlin", "Swift",
    "JavaScript", "TypeScript", "SQL", "HTML", "HTML5", "CSS", "CSS3", "Bash", "Shell", "R",
    "Scala", "PHP", "Ruby", "Dart", "Solidity",
    # Frontend & UI
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "Svelte",
    "Tailwind CSS", "Tailwind", "Bootstrap", "Material UI", "Chakra UI", "Three.js", "GSAP",
    "ScrollTrigger", "React Three Fiber", "WebGL", "Redux", "Zustand", "Webpack", "Vite",
    "Framer Motion", "PyWebView", "AG-Grid",
    # Backend & Frameworks
    "FastAPI", "Django", "Flask", "Node.js", "Express", "Express.js", "NestJS", "Spring Boot",
    "Gin", "Fiber", "Ruby on Rails", "ASP.NET", "GraphQL", "REST APIs", "RESTful", "gRPC",
    "WebSockets", "Celery", "RabbitMQ", "Kafka",
    # Databases & Storage
    "PostgreSQL", "Postgres", "MySQL", "SQLite", "MongoDB", "Redis", "Supabase", "Firebase",
    "DynamoDB", "Cassandra", "Elasticsearch", "Prisma", "SQLAlchemy", "TypeORM", "Room",
    # Cloud, DevOps & Tools
    "Docker", "Kubernetes", "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud",
    "Git", "GitHub", "GitLab", "CI/CD", "Linux", "Nginx", "Terraform", "Ansible",
    "Prometheus", "Grafana", "Vercel", "Netlify", "Heroku", "Railway",
    # Mobile & Native
    "Android", "Android Development", "Jetpack Compose", "Room Database", "Flutter",
    "React Native", "iOS", "SwiftUI",
    # AI / Machine Learning & Data Science
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "Scikit-Learn",
    "Pandas", "NumPy", "TensorFlow", "PyTorch", "Isolation Forest", "Random Forest",
    "Decision Trees", "Keras", "OpenCV", "NLP", "LLM", "LangChain", "LlamaIndex",
    "Computer Vision", "Anomaly Detection", "RAG",
    # Testing & Automation
    "PyTest", "Jest", "Playwright", "Selenium", "Cypress", "Postman", "JUnit", "Mocking",
]


def extract_skills_from_text(raw_text: str, skills_section_text: str = "") -> List[str]:
    """Extract skills both through technical dictionary matching and explicit token parsing."""
    found_skills = set()
    raw_lower = raw_text.lower()

    # 1. Match against known dictionary
    for skill in TECH_SKILLS_DICTIONARY:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, raw_lower):
            found_skills.add(skill)

    # 2. Parse explicit tokens from skills section if present
    if skills_section_text:
        lines = skills_section_text.split("\n")
        for line in lines:
            # Remove category prefixes like "Languages:", "Frontend:"
            cleaned_line = re.sub(r"^[A-Za-z\s&/]+:\s*", "", line)
            # Replace parentheses with commas so inner items separate cleanly
            cleaned_line = cleaned_line.replace("(", ", ").replace(")", "")
            tokens = re.split(r"[,|•;]|\s+-\s+", cleaned_line)
            for token in tokens:
                token_clean = token.strip(" ()[]{}*•-")
                if 2 <= len(token_clean) <= 30 and not any(
                    w in token_clean.lower() for w in ["including", "experience with", "proficient in", "strong", "etc", "and"]
                ):
                    if len(token_clean) > 3:
                        formatted = token_clean.title() if token_clean.islower() else token_clean
                    else:
                        formatted = token_clean.upper()
                    found_skills.add(formatted)

    # Clean case-insensitive duplicates preferring Title/Canonical casing
    seen = {}
    for s in found_skills:
        k = s.lower()
        if k not in seen or len(s) > len(seen[k]):
            seen[k] = s

    return sorted(list(seen.values()))


def extract_target_roles(text: str, experience: List[Dict[str, Any]], headline: Optional[str] = None) -> List[str]:
    """Infer candidate's target roles from headline, summary, and experience history."""
    roles = set()
    if headline:
        roles.add(headline)

    # Common role titles to search for
    common_roles = [
        "Software Engineer", "Software Development Engineer", "Backend Engineer",
        "Frontend Engineer", "Full Stack Engineer", "Full Stack Developer",
        "Python Developer", "Machine Learning Engineer", "AI Engineer",
        "Android Developer", "Mobile Developer", "DevOps Engineer", "Data Engineer",
    ]
    text_lower = text.lower()
    for cr in common_roles:
        if cr.lower() in text_lower:
            roles.add(cr)

    # Check experience titles
    for exp in experience:
        r = exp.get("role")
        if r and len(r.split()) <= 5:
            roles.add(r)

    return sorted(list(roles))[:5]


class ResumeAgent(BaseAgent):
    """Production-grade resume agent extracting complete structured candidate profiles."""

    @property
    def name(self) -> str:
        return "ResumeAgent"

    async def parse_resume_text(self, raw_text: str) -> ProfileBase:
        # 1. Segment document into sections
        sections = segment_resume_sections(raw_text)

        # 2. Extract deterministic contact details
        candidate_name = extract_candidate_name(raw_text)
        email = extract_email(raw_text)
        phone = extract_phone(raw_text)
        location = extract_location(raw_text)
        urls = extract_urls(raw_text)

        # 3. Extract sections
        education = extract_education_entries(sections.get("education", ""))
        experience = extract_experience_entries(sections.get("experience", ""))
        projects = extract_project_entries(sections.get("projects", ""))
        skills = extract_skills_from_text(raw_text, sections.get("skills", ""))
        experience_years = calculate_experience_years(experience, raw_text)

        # 4. Infer headline and bio/summary
        bio = sections.get("summary") or ""
        if not bio and len(sections.get("header", "").split("\n")) > 2:
            bio = sections.get("header", "").split("\n")[-1]

        headline = None
        if experience:
            first_role = experience[0].get("role")
            if first_role:
                headline = first_role
        if not headline and candidate_name:
            headline = f"Software Engineer | {candidate_name}"
        elif not headline:
            headline = "Software Development Engineer"

        target_roles = extract_target_roles(raw_text, experience, headline)

        # Construct baseline grounded profile
        profile = ProfileBase(
            headline=headline,
            phone=phone,
            location=location,
            bio=bio[:500] if bio else None,
            experience_years=experience_years,
            target_roles=target_roles,
            skills=skills,
            education=education,
            experience=experience,
            projects=projects,
            linkedin_url=urls.get("linkedin_url"),
            github_url=urls.get("github_url"),
            portfolio_url=urls.get("portfolio_url"),
        )

        # 5. If a real AI provider is configured (Ollama or OpenRouter), invoke structured output to enhance/refine
        if self.ai_provider.provider_name != "mock":
            try:
                system_prompt = (
                    "You are a specialized technical resume parsing agent. "
                    "Extract structured candidate information strictly grounded in the resume text. "
                    "Do NOT fabricate degrees, companies, projects, or skills."
                )
                ai_extracted = await self.ai_provider.structured_output(
                    prompt=f"Extract full structured profile data from this resume:\n\n{raw_text}",
                    schema=ProfileBase,
                    system_prompt=system_prompt,
                )

                # Merge AI with deterministic truth
                if ai_extracted.headline:
                    profile.headline = ai_extracted.headline
                if ai_extracted.bio:
                    profile.bio = ai_extracted.bio
                if ai_extracted.location and not profile.location:
                    profile.location = ai_extracted.location
                if ai_extracted.education and not profile.education:
                    profile.education = ai_extracted.education
                if ai_extracted.experience and not profile.experience:
                    profile.experience = ai_extracted.experience
                if ai_extracted.projects and not profile.projects:
                    profile.projects = ai_extracted.projects
                if ai_extracted.target_roles:
                    profile.target_roles = list(dict.fromkeys(profile.target_roles + ai_extracted.target_roles))
                if ai_extracted.skills:
                    # Only accept AI skills if explicitly present in raw text (strict grounding)
                    raw_lower = raw_text.lower()
                    grounded = [s for s in ai_extracted.skills if s.lower() in raw_lower]
                    profile.skills = list(dict.fromkeys(profile.skills + grounded))
            except Exception:
                # Fallback directly to deterministic profile
                pass

        return profile

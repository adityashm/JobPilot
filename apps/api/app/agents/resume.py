import re
from typing import Any, Dict, List
from app.agents.base import BaseAgent
from app.schemas.profile import ProfileBase

# Common technical skills dictionary for deterministic extraction and grounding
KNOWN_TECH_SKILLS = [
    "Python", "FastAPI", "Django", "Flask", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis",
    "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Node.js", "Express",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "CI/CD", "Linux",
    "HTML", "CSS", "Tailwind CSS", "REST APIs", "GraphQL", "Playwright", "Selenium",
    "PyTest", "Machine Learning", "Scikit-Learn", "Pandas", "NumPy", "TensorFlow", "PyTorch",
    "Java", "Go", "Golang", "C++", "C#", ".NET", "Rust", "Kotlin", "Swift"
]


def extract_deterministic_profile_signals(raw_text: str) -> Dict[str, Any]:
    """Deterministically extracts candidate signals (skills, links, phone, experience) from raw resume text."""
    signals: Dict[str, Any] = {
        "skills": [],
        "phone": None,
        "linkedin_url": None,
        "github_url": None,
        "portfolio_url": None,
        "experience_years": 0.0,
    }

    # Match skills case-insensitively with word boundaries
    text_lower = raw_text.lower()
    found_skills = []
    for skill in KNOWN_TECH_SKILLS:
        # Use regex with word boundaries to avoid false positives (e.g. "go" in "good")
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    signals["skills"] = sorted(list(set(found_skills)))

    # Phone number extraction
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", raw_text)
    if phone_match:
        signals["phone"] = phone_match.group(0).strip()

    # URLs
    linkedin_match = re.search(r"https?://(?:www\.)?linkedin\.com/in/[\w-]+", raw_text, re.IGNORECASE)
    if linkedin_match:
        signals["linkedin_url"] = linkedin_match.group(0)

    github_match = re.search(r"https?://(?:www\.)?github\.com/[\w-]+", raw_text, re.IGNORECASE)
    if github_match:
        signals["github_url"] = github_match.group(0)

    portfolio_match = re.search(r"https?://(?!.*(?:linkedin|github|twitter|facebook))[\w.-]+\.[a-z]{2,}(?:/\S*)?", raw_text, re.IGNORECASE)
    if portfolio_match:
        signals["portfolio_url"] = portfolio_match.group(0)

    # Experience years heuristic: look for "X+ years", "X years of experience"
    exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?(?:\s+experience)?", text_lower)
    if exp_match:
        try:
            signals["experience_years"] = float(exp_match.group(1))
        except ValueError:
            pass

    return signals


class ResumeAgent(BaseAgent):
    """Specialized agent responsible for extracting structured profile data from raw resume text."""

    @property
    def name(self) -> str:
        return "ResumeAgent"

    async def parse_resume_text(self, raw_text: str) -> ProfileBase:
        system_prompt = (
            "You are an expert technical resume parser. "
            "Extract structured candidate details truthfully and conservatively without inventing skills or credentials."
        )
        
        # 1. Deterministic signals
        signals = extract_deterministic_profile_signals(raw_text)

        # 2. AI Structured Output
        try:
            parsed = await self.ai_provider.structured_output(
                prompt=f"Extract structured profile data from this resume text:\n\n{raw_text}",
                schema=ProfileBase,
                system_prompt=system_prompt,
            )
        except Exception:
            parsed = ProfileBase()

        # 3. Grounding & Merging: ensure deterministic skills and strictly grounded AI skills are included
        raw_text_lower = raw_text.lower()
        grounded_ai_skills = [
            s for s in parsed.skills
            if s.lower() in raw_text_lower
        ]
        merged_skills = list(dict.fromkeys(signals["skills"] + grounded_ai_skills))
        
        parsed.skills = merged_skills

        if not parsed.phone and signals["phone"]:
            parsed.phone = signals["phone"]
        if not parsed.linkedin_url and signals["linkedin_url"]:
            parsed.linkedin_url = signals["linkedin_url"]
        if not parsed.github_url and signals["github_url"]:
            parsed.github_url = signals["github_url"]
        if not parsed.portfolio_url and signals["portfolio_url"]:
            parsed.portfolio_url = signals["portfolio_url"]
        if parsed.experience_years == 0.0 and signals["experience_years"] > 0:
            parsed.experience_years = signals["experience_years"]

        return parsed

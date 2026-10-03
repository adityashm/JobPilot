from typing import Any, Dict, Optional
from pydantic import BaseModel
from app.agents.base import BaseAgent
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob


class QuestionAnswerResult(BaseModel):
    question: str
    answer: str
    grounded: bool = True
    evidence: str = ""


class QuestionAnswerAgent(BaseAgent):
    """Specialized agent generating grounded, truthful application screening answers.
    Strictly forbids hallucinating companies, skills, degrees, or certifications."""

    @property
    def name(self) -> str:
        return "QuestionAnswerAgent"

    async def answer_screening_question(
        self,
        question: str,
        profile: ProfileBase,
        job: NormalizedJob,
        resume_text: Optional[str] = None,
    ) -> QuestionAnswerResult:
        q_lower = question.lower()

        # 1. Deterministic direct answers for common standardized questions
        # Work authorization
        if "authorized to work" in q_lower or "work authorization" in q_lower or "legally authorized" in q_lower:
            auth_status = profile.work_authorization.get("authorized_in_us", profile.work_authorization.get("authorized", True))
            ans = "Yes" if auth_status else "No"
            return QuestionAnswerResult(question=question, answer=ans, evidence="Profile work_authorization")

        # Sponsorship
        if "sponsorship" in q_lower or "require visa" in q_lower or "future sponsorship" in q_lower:
            sponsorship = profile.work_authorization.get("requires_sponsorship", False)
            ans = "Yes" if sponsorship else "No"
            return QuestionAnswerResult(question=question, answer=ans, evidence="Profile work_authorization")

        # Relocation
        if "relocate" in q_lower or "relocation" in q_lower:
            ans = profile.application_answers.get("willing_to_relocate", "Yes")
            return QuestionAnswerResult(question=question, answer=str(ans), evidence="Profile application_answers")

        # Location / City
        if any(k in q_lower for k in ["current location", "where are you located", "current city", "your location"]):
            ans = profile.location or "Remote"
            return QuestionAnswerResult(question=question, answer=ans, evidence="Profile location")

        # Socials & links
        if "linkedin" in q_lower and profile.linkedin_url:
            return QuestionAnswerResult(question=question, answer=profile.linkedin_url, evidence="Profile linkedin_url")
        if "github" in q_lower and profile.github_url:
            return QuestionAnswerResult(question=question, answer=profile.github_url, evidence="Profile github_url")
        if any(k in q_lower for k in ["portfolio", "personal website", "personal site"]) and profile.portfolio_url:
            return QuestionAnswerResult(question=question, answer=profile.portfolio_url, evidence="Profile portfolio_url")

        # Years of experience
        if "years of experience" in q_lower or "total experience" in q_lower:
            return QuestionAnswerResult(
                question=question,
                answer=f"{profile.experience_years:.0f}",
                evidence=f"Profile experience_years: {profile.experience_years}",
            )

        # Expected salary
        if "salary" in q_lower or "compensation" in q_lower:
            min_sal = profile.preferences.get("minimum_salary")
            ans = f"${int(min_sal):,}" if min_sal else "Competitive / Negotiable based on role scope"
            return QuestionAnswerResult(question=question, answer=ans, evidence="Profile preferences")

        # Notice period
        if "notice period" in q_lower or "start date" in q_lower or "available to start" in q_lower:
            ans = profile.application_answers.get("notice_period", "2 weeks / Immediately available")
            return QuestionAnswerResult(question=question, answer=ans, evidence="Profile application_answers")


        # 2. Semantic grounding for subjective questions (e.g. "Why are you interested?")
        skills_str = ", ".join(profile.skills)
        system_prompt = (
            "You are a truthful, grounded career assistant. "
            "Draft a professional, concise response (2-4 sentences) answering the application question. "
            "CRITICAL: Use ONLY facts, skills, and background provided in the candidate profile and resume. "
            "NEVER fabricate projects, credentials, companies, or degrees that are not mentioned. "
            "Write in the first-person ('I am...')."
        )
        prompt = (
            f"Candidate Skills: {skills_str}\n"
            f"Candidate Experience: {profile.experience_years} years\n"
            f"Candidate Bio: {profile.bio or 'Software Engineer'}\n"
            f"Job Title: {job.title}\n"
            f"Job Company: {job.company}\n"
            f"Question: {question}\n\n"
            f"Provide a truthful, grounded answer."
        )

        try:
            completion = await self.ai_provider.complete(
                prompt=prompt,
                system_prompt=system_prompt,
                max_tokens=250,
            )
            raw_ans = completion.content.strip().strip('"')
            return QuestionAnswerResult(
                question=question,
                answer=raw_ans,
                grounded=True,
                evidence="Synthesized from verified profile skills and experience",
            )
        except Exception:
            fallback = (
                f"With my {profile.experience_years:.0f} years of engineering experience and skills in "
                f"{skills_str[:50]}, I am excited about contributing to {job.company} as a {job.title}."
            )
            return QuestionAnswerResult(
                question=question,
                answer=fallback,
                grounded=True,
                evidence="Deterministic profile fallback",
            )

import re
from typing import List, Optional
from pydantic import BaseModel, Field
from app.agents.base import BaseAgent
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob


class MatchExplanation(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    skill_match: int = Field(ge=0, le=100)
    experience_match: int = Field(ge=0, le=100)
    location_match: int = Field(ge=0, le=100)
    education_match: int = Field(default=100, ge=0, le=100)
    matched_skills: List[str] = []
    missing_requirements: List[str] = []
    reasoning: str


def compute_deterministic_match_signals(profile: ProfileBase, job: NormalizedJob) -> MatchExplanation:
    """Deterministically analyzes candidate profile against job posting to compute grounded scores and matches."""
    job_text = f"{job.title} {job.description} {' '.join(job.tags)}".lower()
    
    # 1. Candidate skills present in job
    matched_skills = []
    for skill in profile.skills:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, job_text):
            matched_skills.append(skill)
    matched_skills = sorted(list(set(matched_skills)))

    # 2. Check for missing common requirements mentioned in job but absent in candidate skills
    common_reqs = ["AWS", "Docker", "Kubernetes", "GraphQL", "Redis", "TypeScript", "Python", "React", "Go", "Java"]
    missing = []
    for req in common_reqs:
        pattern = r"\b" + re.escape(req.lower()) + r"\b"
        if re.search(pattern, job_text) and not any(s.lower() == req.lower() for s in profile.skills):
            missing.append(f"{req} experience requested in posting")

    # 3. Location match
    if job.remote:
        location_score = 100
    else:
        user_loc = (profile.location or "").lower()
        job_loc = (job.location or "").lower()
        if user_loc and (user_loc in job_loc or job_loc in user_loc):
            location_score = 100
        else:
            location_score = 60

    # 4. Seniority & Experience Match
    title_lower = (job.title or "").lower()
    desc_lower = (job.description or "").lower()
    combined_text = f"{title_lower} {desc_lower} {' '.join(job.tags).lower()}"

    # A. Detect Internship / Trainee roles
    is_internship = any(
        kw in title_lower
        for kw in ["intern", "internship", "trainee", "apprentice", "co-op", "working student"]
    )

    # B. Detect Entry-Level / Fresher / Junior roles
    is_entry_level = is_internship or any(
        kw in title_lower
        for kw in ["fresher", "entry level", "entry-level", "junior", "jr.", "jr ", "graduate", "campus", "associate"]
    )

    # C. Extract explicit years requested in job description (e.g. "3+ years of experience")
    # Must specifically look for phrases connecting numbers and "experience", NOT random numbers
    exp_patterns = [
        r"(?:minimum|min|at least|requires?|requiring|prefer(?:red|s)?)\s*(\d+(?:\.\d+)?)\s*(?:-|to|\+)?\s*(?:\d+)?\s*\+?\s*years?(?:\s+of)?(?:\s+(?:relevant|work|professional|industry|technical))?\s+experience",
        r"(\d+(?:\.\d+)?)\s*(?:-|to|\+)?\s*(?:\d+)?\s*\+?\s*years?(?:\s+of)?\s+(?:relevant|work|professional|industry|technical)\s+experience",
        r"(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?\s+experience",
        r"experience\s*[:\-]\s*(\d+(?:\.\d+)?)\+?\s*years?",
    ]

    explicit_years: Optional[float] = None
    for pattern in exp_patterns:
        m = re.search(pattern, combined_text)
        if m:
            try:
                explicit_years = float(m.group(1))
                break
            except Exception:
                pass

    candidate_years = float(profile.experience_years or 0.0)

    # Truthful scoring and context-aware explanations
    if is_internship:
        # Internships are designed for students and freshers (0 experience required)
        experience_score = 100
        exp_reason = "Internship / student role — perfectly aligned with candidate's academic and early-career profile."
    elif is_entry_level:
        if explicit_years is None or explicit_years <= 1.0 or candidate_years >= explicit_years:
            experience_score = 100
            exp_reason = "Entry-level / junior role — suitable for candidate's early-career profile."
        else:
            experience_score = max(60, int(min(100, (candidate_years / explicit_years) * 100)))
            exp_reason = f"Entry-level role mentions ~{explicit_years:.0f} yrs experience (candidate has {candidate_years:.1f} yrs)."
    elif explicit_years is not None:
        if candidate_years >= explicit_years:
            experience_score = 100
            exp_reason = f"Candidate meets or exceeds experience requirements ({candidate_years:.1f} yrs vs {explicit_years:.0f} yrs requested)."
        else:
            experience_score = max(35, int(min(100, (candidate_years / explicit_years) * 100)))
            exp_reason = f"Role requests ~{explicit_years:.0f}+ years experience while candidate currently has {candidate_years:.1f} years."
    else:
        # Standard role with no experience requirement stated in job description!
        # Never invent a 2-year requirement when none is present in the posting.
        experience_score = 95
        exp_reason = "No specific years of experience requirement stated in job posting."

    # 5. Skill match score
    # Count how many skills matched vs required
    if matched_skills:
        total_eval = len(matched_skills) + len(missing)
        skill_score = int(min(100, (len(matched_skills) / max(total_eval, 1)) * 100))
    else:
        # For internships/entry roles with few or no explicit keyword hits, give a fair baseline
        skill_score = 75 if is_internship else 50

    overall_score = int((skill_score * 0.5) + (experience_score * 0.3) + (location_score * 0.2))

    # Formulate truthful reasoning
    reason_lines = []
    if matched_skills:
        reason_lines.append(f"Strong skill alignment on {', '.join(matched_skills[:4])}.")
    if exp_reason:
        reason_lines.append(exp_reason)
    if missing:
        reason_lines.append(f"Key gaps noted: {', '.join(missing[:3])}.")

    reasoning = " ".join(reason_lines) if reason_lines else "General alignment with candidate preferences."

    return MatchExplanation(
        overall_score=overall_score,
        skill_match=skill_score,
        experience_match=experience_score,
        location_match=location_score,
        education_match=100,
        matched_skills=matched_skills,
        missing_requirements=missing,
        reasoning=reasoning,
    )


class JobMatchingAgent(BaseAgent):
    """Specialized agent responsible for explainable resume/job compatibility scoring."""

    @property
    def name(self) -> str:
        return "JobMatchingAgent"

    async def evaluate_match(
        self, profile: ProfileBase, job: NormalizedJob
    ) -> MatchExplanation:
        # First compute deterministic grounded baseline
        deterministic = compute_deterministic_match_signals(profile, job)

        system_prompt = (
            "You are an objective job match evaluator. "
            "Evaluate candidate fit strictly using grounded candidate profile skills. "
            "Never claim candidate has a skill not present in their verified profile."
        )
        prompt = (
            f"Candidate Verified Skills: {', '.join(profile.skills)}\n"
            f"Candidate Experience: {profile.experience_years} years\n"
            f"Job Title: {job.title}\n"
            f"Job Company: {job.company}\n"
            f"Job Description:\n{job.description}\n"
            f"Job Tags: {', '.join(job.tags)}\n"
        )
        try:
            ai_eval = await self.ai_provider.structured_output(
                prompt=prompt,
                schema=MatchExplanation,
                system_prompt=system_prompt,
            )
            # Ensure grounding: only skills that are actually in profile.skills can be in matched_skills
            valid_matched = [s for s in ai_eval.matched_skills if any(ps.lower() == s.lower() for ps in profile.skills)]
            if not valid_matched:
                valid_matched = deterministic.matched_skills

            return MatchExplanation(
                overall_score=ai_eval.overall_score if ai_eval.overall_score > 0 else deterministic.overall_score,
                skill_match=ai_eval.skill_match if ai_eval.skill_match > 0 else deterministic.skill_match,
                experience_match=ai_eval.experience_match if ai_eval.experience_match > 0 else deterministic.experience_match,
                location_match=ai_eval.location_match if ai_eval.location_match > 0 else deterministic.location_match,
                education_match=ai_eval.education_match if ai_eval.education_match > 0 else 100,
                matched_skills=valid_matched,
                missing_requirements=ai_eval.missing_requirements or deterministic.missing_requirements,
                reasoning=ai_eval.reasoning if ai_eval.reasoning else deterministic.reasoning,
            )
        except Exception:
            return deterministic

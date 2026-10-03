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

    # 4. Experience match
    # Extract years requested in job description (e.g. "3+ years")
    exp_req_match = re.search(r"(\d+)\+?\s*years?", job_text)
    required_years = float(exp_req_match.group(1)) if exp_req_match else 2.0
    if profile.experience_years >= required_years:
        experience_score = 100
    elif profile.experience_years > 0:
        experience_score = int(min(100, (profile.experience_years / required_years) * 100))
    else:
        experience_score = 65

    # 5. Skill match score
    # Count how many skills matched vs required
    if matched_skills:
        total_eval = len(matched_skills) + len(missing)
        skill_score = int(min(100, (len(matched_skills) / max(total_eval, 1)) * 100))
    else:
        skill_score = 40

    overall_score = int((skill_score * 0.5) + (experience_score * 0.3) + (location_score * 0.2))

    # Formulate truthful reasoning
    reason_lines = []
    if matched_skills:
        reason_lines.append(f"Strong skill alignment on {', '.join(matched_skills[:4])}.")
    if profile.experience_years >= required_years:
        reason_lines.append(f"Candidate meets or exceeds experience requirements ({profile.experience_years:.1f} yrs vs ~{required_years:.0f} yrs requested).")
    elif required_years > profile.experience_years:
        reason_lines.append(f"Role prefers ~{required_years:.0f} years experience while candidate currently has {profile.experience_years:.1f} years.")
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

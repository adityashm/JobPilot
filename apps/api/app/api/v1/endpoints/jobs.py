from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.job import Job
from app.models.job_match import JobMatch
from app.models.application import Application
from app.models.user import User
from app.providers.factory import get_ai_provider
from app.agents.matching import JobMatchingAgent, MatchExplanation
from app.services.job_discovery import job_discovery_service
from app.schemas.job import JobResponse, JobDetailResponse, JobSearchRequest
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob

router = APIRouter()


@router.post("/search", response_model=List[JobResponse])
async def search_and_discover_jobs(
    search_req: JobSearchRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Discover jobs across supported sources, perform deterministic filtering and deduplication, and return."""
    filters = {
        "remote": search_req.remote,
        "salary_min": search_req.salary_min,
        "location": search_req.location,
        "excluded_keywords": search_req.excluded_keywords,
    }
    jobs = await job_discovery_service.discover_jobs(
        db=db,
        query=search_req.query,
        filters=filters,
        limit=search_req.limit,
    )
    return jobs


@router.get("", response_model=List[JobResponse])
@router.get("/", response_model=List[JobResponse], include_in_schema=False)
def list_jobs(
    query: Optional[str] = Query(None, description="Search term for title or company"),
    remote: Optional[bool] = Query(None, description="Filter for remote jobs"),
    min_salary: Optional[float] = Query(None, description="Minimum salary threshold"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List discovered jobs stored in the database with optional filtering."""
    q = db.query(Job)
    if query:
        pattern = f"%{query}%"
        q = q.filter((Job.title.ilike(pattern)) | (Job.company.ilike(pattern)) | (Job.description.ilike(pattern)))
    if remote is not None:
        q = q.filter(Job.remote == remote)
    if min_salary is not None:
        q = q.filter(Job.salary_max >= min_salary)

    jobs = q.order_by(Job.discovered_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job_detail(
    job_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve detailed job information along with user's match score and application status if any."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Check for existing match
    match_record = (
        db.query(JobMatch)
        .filter(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id)
        .first()
    )
    match_explanation = None
    if match_record:
        if "Role prefers ~" in (match_record.reasoning or "") and current_user.profile:
            from app.agents.matching import compute_deterministic_match_signals
            from app.jobs.schemas import NormalizedJob
            from app.schemas.profile import ProfileBase
            p_profile = ProfileBase(
                headline=current_user.profile.headline,
                phone=current_user.profile.phone,
                location=current_user.profile.location,
                experience_years=current_user.profile.experience_years,
                skills=current_user.profile.skills or [],
                education=current_user.profile.education or [],
                experience=current_user.profile.experience or [],
                projects=current_user.profile.projects or [],
            )
            n_job = NormalizedJob(
                id=job.id,
                title=job.title,
                company=job.company,
                description=job.description,
                location=job.location,
                remote=job.remote,
                url=job.url,
                source=job.source,
                tags=job.tags or [],
            )
            match_explanation = compute_deterministic_match_signals(p_profile, n_job)
            match_record.overall_score = match_explanation.overall_score
            match_record.skill_match = match_explanation.skill_match
            match_record.experience_match = match_explanation.experience_match
            match_record.location_match = match_explanation.location_match
            match_record.education_match = match_explanation.education_match
            match_record.reasoning = match_explanation.reasoning
            match_record.matched_skills = match_explanation.matched_skills
            match_record.missing_requirements = match_explanation.missing_requirements
            db.add(match_record)
            db.commit()
        else:
            match_explanation = MatchExplanation(
                overall_score=match_record.overall_score,
                skill_match=match_record.skill_match,
                experience_match=match_record.experience_match,
                location_match=match_record.location_match,
                education_match=match_record.education_match,
                matched_skills=match_record.matched_skills or [],
                missing_requirements=match_record.missing_requirements or [],
                reasoning=match_record.reasoning or "",
            )

    # Check for existing application
    app_record = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.user_id == current_user.id)
        .first()
    )

    return JobDetailResponse(
        id=job.id,
        title=job.title,
        company=job.company,
        description=job.description,
        location=job.location,
        remote=job.remote,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        currency=job.currency,
        url=job.url,
        source=job.source,
        external_id=job.external_id,
        posted_at=job.posted_at,
        discovered_at=job.discovered_at,
        tags=job.tags or [],
        match=match_explanation,
        is_saved=app_record is not None,
        application_id=app_record.id if app_record else None,
        application_status=app_record.status if app_record else None,
    )


@router.post("/{job_id}/match", response_model=MatchExplanation)
async def evaluate_job_match(
    job_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Run explainable AI and deterministic matching against candidate profile and store result."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    profile_obj = current_user.profile
    if not profile_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not initialized. Please upload a resume or update your profile first.",
        )

    # Convert to Pydantic profile
    pydantic_profile = ProfileBase(
        headline=profile_obj.headline,
        phone=profile_obj.phone,
        location=profile_obj.location,
        bio=profile_obj.bio,
        experience_years=profile_obj.experience_years,
        target_roles=profile_obj.target_roles or [],
        skills=profile_obj.skills or [],
        education=profile_obj.education or [],
        experience=profile_obj.experience or [],
        projects=profile_obj.projects or [],
        work_authorization=profile_obj.work_authorization or {},
        application_answers=profile_obj.application_answers or {},
        preferences=profile_obj.preferences or {},
    )

    normalized_job = NormalizedJob(
        id=job.id,
        title=job.title,
        company=job.company,
        description=job.description,
        location=job.location,
        remote=job.remote,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        currency=job.currency,
        url=job.url,
        source=job.source,
        tags=job.tags or [],
    )

    ai_provider = get_ai_provider()
    matching_agent = JobMatchingAgent(ai_provider=ai_provider)
    explanation = await matching_agent.evaluate_match(pydantic_profile, normalized_job)

    # Persist or update Match
    existing_match = (
        db.query(JobMatch)
        .filter(JobMatch.job_id == job_id, JobMatch.user_id == current_user.id)
        .first()
    )
    if existing_match:
        existing_match.overall_score = explanation.overall_score
        existing_match.skill_match = explanation.skill_match
        existing_match.experience_match = explanation.experience_match
        existing_match.location_match = explanation.location_match
        existing_match.education_match = explanation.education_match
        existing_match.matched_skills = explanation.matched_skills
        existing_match.missing_requirements = explanation.missing_requirements
        existing_match.reasoning = explanation.reasoning
        db.add(existing_match)
    else:
        new_match = JobMatch(
            job_id=job.id,
            user_id=current_user.id,
            overall_score=explanation.overall_score,
            skill_match=explanation.skill_match,
            experience_match=explanation.experience_match,
            location_match=explanation.location_match,
            education_match=explanation.education_match,
            matched_skills=explanation.matched_skills,
            missing_requirements=explanation.missing_requirements,
            reasoning=explanation.reasoning,
        )
        db.add(new_match)

    db.commit()
    return explanation

from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.job_match import JobMatch
from app.models.user import User

router = APIRouter()


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any], include_in_schema=False)
def get_user_analytics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve detailed analytics and pipeline metrics for the user's job search."""
    total_jobs = db.query(Job).count()
    user_matches_count = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).count()

    # Applications breakdown by status
    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.user_id == current_user.id)
        .group_by(Application.status)
        .all()
    )
    status_dict = {status: count for status, count in status_counts}

    total_applications = sum(status_dict.values())
    applied_count = status_dict.get(ApplicationStatus.APPLIED, 0)
    interviews_count = status_dict.get(ApplicationStatus.INTERVIEW, 0)
    screening_count = status_dict.get(ApplicationStatus.SCREENING, 0)
    offers_count = status_dict.get(ApplicationStatus.OFFER, 0)
    rejected_count = status_dict.get(ApplicationStatus.REJECTED, 0)

    # Response & interview rates
    positive_responses = interviews_count + screening_count + offers_count
    response_rate = round((positive_responses / max(applied_count, 1)) * 100, 1) if applied_count > 0 else 0.0
    interview_rate = round((interviews_count / max(applied_count, 1)) * 100, 1) if applied_count > 0 else 0.0

    # Applications by source
    source_counts = (
        db.query(Job.source, func.count(Application.id))
        .join(Application, Application.job_id == Job.id)
        .filter(Application.user_id == current_user.id)
        .group_by(Job.source)
        .all()
    )
    by_source = {src: count for src, count in source_counts}

    # Applications by company (top 5)
    company_counts = (
        db.query(Job.company, func.count(Application.id))
        .join(Application, Application.job_id == Job.id)
        .filter(Application.user_id == current_user.id)
        .group_by(Job.company)
        .order_by(func.count(Application.id).desc())
        .limit(5)
        .all()
    )
    by_company = {comp: count for comp, count in company_counts}

    return {
        "jobs_discovered": total_jobs,
        "jobs_matched": user_matches_count,
        "applications_total": total_applications,
        "applications_applied": applied_count,
        "interviews_count": interviews_count,
        "screening_count": screening_count,
        "offers_count": offers_count,
        "rejected_count": rejected_count,
        "response_rate": response_rate,
        "interview_rate": interview_rate,
        "status_breakdown": status_dict,
        "applications_by_source": by_source,
        "applications_by_company": by_company,
    }

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.services.application_service import application_service
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationPrepareRequest,
    ApplicationSubmitRequest,
    ApplicationResponse,
)

router = APIRouter()


@router.get("", response_model=List[ApplicationResponse])
@router.get("/", response_model=List[ApplicationResponse], include_in_schema=False)
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List applications in candidate pipeline, optionally filtered by status."""
    q = db.query(Application).filter(Application.user_id == current_user.id)
    if status_filter:
        q = q.filter(Application.status == status_filter.upper())
    apps = q.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    return apps


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_application(
    app_in: ApplicationCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Save a job into the candidate's application pipeline."""
    try:
        app_record = application_service.create_application(
            db=db,
            user=current_user,
            job_id=app_in.job_id,
            resume_id=app_in.resume_id,
            notes=app_in.notes,
        )
        return app_record
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve full details of a specific application including answers and automation logs."""
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return app_record


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    app_update: ApplicationUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update application details, answers, notes, or status."""
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app_update.status:
        upper_status = app_update.status.upper()
        if upper_status not in ApplicationStatus.ALL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{app_update.status}'. Allowed: {ApplicationStatus.ALL}",
            )
        app_record.status = upper_status

    if app_update.resume_id is not None:
        app_record.resume_id = app_update.resume_id

    if app_update.answers is not None:
        merged_answers = dict(app_record.answers or {})
        merged_answers.update(app_update.answers)
        app_record.answers = merged_answers

    if app_update.notes is not None:
        app_record.notes = app_update.notes

    db.add(app_record)
    db.commit()
    db.refresh(app_record)
    return app_record


@router.post("/{application_id}/prepare", response_model=ApplicationResponse)
async def prepare_application_submission(
    application_id: int,
    prepare_req: ApplicationPrepareRequest = ApplicationPrepareRequest(),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Synthesize grounded AI screening answers and transition application to REVIEW for human approval."""
    try:
        app_record = await application_service.prepare_application(
            db=db,
            application_id=application_id,
            user=current_user,
            custom_questions=prepare_req.custom_questions,
        )
        return app_record
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
def submit_application_with_approval(
    application_id: int,
    submit_req: ApplicationSubmitRequest = ApplicationSubmitRequest(),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Submit application after explicit human candidate review and approval."""
    try:
        app_record = application_service.submit_application(
            db=db,
            application_id=application_id,
            user=current_user,
            user_confirmed=submit_req.confirmed,
            submission_notes=submit_req.submission_notes,
        )
        return app_record
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> None:
    """Delete an application record."""
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    db.delete(app_record)
    db.commit()

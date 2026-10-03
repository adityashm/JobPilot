from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.job import JobResponse
from app.schemas.resume import ResumeResponse


class ApplicationCreate(BaseModel):
    job_id: str
    resume_id: Optional[int] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    resume_id: Optional[int] = None
    answers: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class ApplicationPrepareRequest(BaseModel):
    custom_questions: List[str] = []


class ApplicationSubmitRequest(BaseModel):
    confirmed: bool = True
    submission_notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: str
    resume_id: Optional[int] = None
    status: str
    match_score: Optional[int] = None
    answers: Dict[str, Any] = {}
    notes: Optional[str] = None
    automation_logs: List[Dict[str, Any]] = []
    prepared_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    resume: Optional[ResumeResponse] = None

    model_config = ConfigDict(from_attributes=True)

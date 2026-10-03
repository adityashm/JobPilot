from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from app.agents.matching import MatchExplanation


class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    description: str
    location: str
    remote: bool
    employment_type: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "USD"
    url: str
    source: str
    external_id: Optional[str] = None
    posted_at: Optional[datetime] = None
    discovered_at: datetime
    tags: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class JobDetailResponse(JobResponse):
    match: Optional[MatchExplanation] = None
    is_saved: bool = False
    application_id: Optional[int] = None
    application_status: Optional[str] = None


class JobSearchRequest(BaseModel):
    query: str = ""
    remote: Optional[bool] = None
    salary_min: Optional[float] = None
    location: Optional[str] = None
    excluded_keywords: List[str] = []
    limit: int = 50

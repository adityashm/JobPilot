from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, HttpUrl, Field


class NormalizedJob(BaseModel):
    """Canonical schema for normalized job listings across all discovery sources."""

    id: Optional[str] = None
    title: str
    company: str
    description: str
    location: str
    remote: bool = False
    employment_type: str = "Full-time"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "USD"
    url: str
    source: str
    external_id: Optional[str] = None
    posted_at: Optional[datetime] = None
    discovered_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: List[str] = []

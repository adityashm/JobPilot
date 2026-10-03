from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ProfileBase(BaseModel):
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    experience_years: float = 0.0
    target_roles: List[str] = []
    skills: List[str] = []
    education: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    work_authorization: Dict[str, Any] = {
        "authorized_in_us": True,
        "requires_sponsorship": False,
        "work_visa_status": "Citizen",
    }
    application_answers: Dict[str, Any] = {}
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    preferences: Dict[str, Any] = {
        "locations": [],
        "remote": True,
        "employment_types": ["Full-time"],
        "minimum_salary": None,
    }


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[float] = None
    target_roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    education: Optional[List[Dict[str, Any]]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    work_authorization: Optional[Dict[str, Any]] = None
    application_answers: Optional[Dict[str, Any]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

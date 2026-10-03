from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.profile import ProfileBase


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_path: str
    is_primary: bool
    created_at: datetime
    raw_text_snippet: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ResumeDetailResponse(ResumeResponse):
    raw_text: str


class ResumeUploadResponse(BaseModel):
    resume: ResumeResponse
    extracted_profile: ProfileBase
    message: str = "Resume uploaded and processed successfully"

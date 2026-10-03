import os
from pathlib import Path
import time
from typing import Any, List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.models.resume import Resume
from app.models.user import User
from app.providers.factory import get_ai_provider
from app.agents.resume import ResumeAgent
from app.services.resume_parser import extract_text_from_file
from app.schemas.resume import ResumeResponse, ResumeDetailResponse, ResumeUploadResponse
from app.schemas.profile import ProfileUpdate

router = APIRouter()

UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", response_model=ResumeUploadResponse)
@router.post("/", response_model=ResumeUploadResponse, include_in_schema=False)
async def upload_resume(
    file: UploadFile = File(...),
    auto_update_profile: bool = Form(True),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Upload a resume file (PDF, DOCX, or TXT), extract text, extract profile via AI, and persist."""
    filename = file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only .pdf, .docx, and .txt files are allowed.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 1. Text Extraction
    try:
        raw_text = extract_text_from_file(file_bytes, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from resume: {str(e)}",
        )

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract readable text from the uploaded document.",
        )

    # 2. AI Structured Extraction
    ai_provider = get_ai_provider()
    resume_agent = ResumeAgent(ai_provider=ai_provider)
    extracted_profile = await resume_agent.parse_resume_text(raw_text)

    # 3. Save File to Disk safely
    user_upload_dir = UPLOAD_DIR / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    safe_filename = f"{int(time.time())}_{Path(filename).name}"
    file_path = str(user_upload_dir / safe_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Check if this is the first resume (make it primary)
    existing_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    is_primary = existing_count == 0

    resume_record = Resume(
        user_id=current_user.id,
        filename=filename,
        file_path=file_path,
        raw_text=raw_text,
        is_primary=is_primary,
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    # 4. Optionally sync extracted profile fields into User's Profile
    if auto_update_profile and current_user.profile:
        profile = current_user.profile
        if extracted_profile.skills:
            # Merge skills uniquely
            profile.skills = list(dict.fromkeys(profile.skills + extracted_profile.skills))
        if extracted_profile.phone and not profile.phone:
            profile.phone = extracted_profile.phone
        if extracted_profile.linkedin_url and not profile.linkedin_url:
            profile.linkedin_url = extracted_profile.linkedin_url
        if extracted_profile.github_url and not profile.github_url:
            profile.github_url = extracted_profile.github_url
        if extracted_profile.portfolio_url and not profile.portfolio_url:
            profile.portfolio_url = extracted_profile.portfolio_url
        if extracted_profile.experience_years > profile.experience_years:
            profile.experience_years = extracted_profile.experience_years
        if extracted_profile.target_roles and not profile.target_roles:
            profile.target_roles = extracted_profile.target_roles
        if extracted_profile.education and not profile.education:
            profile.education = extracted_profile.education
        if extracted_profile.experience and not profile.experience:
            profile.experience = extracted_profile.experience
        if extracted_profile.projects and not profile.projects:
            profile.projects = extracted_profile.projects
        if extracted_profile.headline and not profile.headline:
            profile.headline = extracted_profile.headline
        if extracted_profile.bio and not profile.bio:
            profile.bio = extracted_profile.bio
        
        db.add(profile)
        db.commit()

    return ResumeUploadResponse(
        resume=ResumeResponse(
            id=resume_record.id,
            user_id=resume_record.user_id,
            filename=resume_record.filename,
            file_path=resume_record.file_path,
            is_primary=resume_record.is_primary,
            created_at=resume_record.created_at,
            raw_text_snippet=raw_text[:200] + ("..." if len(raw_text) > 200 else ""),
        ),
        extracted_profile=extracted_profile,
        message="Resume uploaded and processed successfully",
    )


@router.get("", response_model=List[ResumeResponse])
@router.get("/", response_model=List[ResumeResponse], include_in_schema=False)
def list_my_resumes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all uploaded resumes belonging to the current user."""
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return [
        ResumeResponse(
            id=r.id,
            user_id=r.user_id,
            filename=r.filename,
            file_path=r.file_path,
            is_primary=r.is_primary,
            created_at=r.created_at,
            raw_text_snippet=r.raw_text[:200] + ("..." if len(r.raw_text) > 200 else ""),
        )
        for r in resumes
    ]


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve resume details and full extracted raw text."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return ResumeDetailResponse(
        id=resume.id,
        user_id=resume.user_id,
        filename=resume.filename,
        file_path=resume.file_path,
        is_primary=resume.is_primary,
        created_at=resume.created_at,
        raw_text=resume.raw_text,
    )


@router.post("/{resume_id}/set-primary", response_model=ResumeResponse)
def set_primary_resume(
    resume_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Set a specific resume as the user's primary application resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Clear other primary flags
    db.query(Resume).filter(Resume.user_id == current_user.id).update({"is_primary": False})
    resume.is_primary = True
    db.commit()
    db.refresh(resume)

    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        filename=resume.filename,
        file_path=resume.file_path,
        is_primary=resume.is_primary,
        created_at=resume.created_at,
        raw_text_snippet=resume.raw_text[:200],
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> None:
    """Delete an uploaded resume."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Remove file from disk if exists
    try:
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
    except Exception:
        pass

    db.delete(resume)
    db.commit()

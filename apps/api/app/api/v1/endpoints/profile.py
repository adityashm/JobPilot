from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.auth import auth_service

router = APIRouter()


@router.get("", response_model=ProfileResponse)
@router.get("/", response_model=ProfileResponse, include_in_schema=False)
def get_my_profile(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve the current authenticated user's structured career profile."""
    if not current_user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found for this user account.",
        )
    return current_user.profile


@router.put("", response_model=ProfileResponse)
@router.put("/", response_model=ProfileResponse, include_in_schema=False)
def update_my_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update the current authenticated user's career profile."""
    profile = auth_service.update_profile(db, user_id=current_user.id, profile_in=profile_in)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return profile

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserWithProfileResponse
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.schemas.token import Token, LoginRequest
from app.services.auth import auth_service

router = APIRouter()


class AuthResponse(Token):
    user: UserWithProfileResponse


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Register a new user and generate access token."""
    existing_user = auth_service.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = auth_service.create_user(db, user_in=user_in)
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=AuthResponse)
def login(
    login_in: LoginRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Login with JSON email and password."""
    user = auth_service.authenticate(db, email=login_in.email, password=login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login/form", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db),
) -> Any:
    """OAuth2 compatible token login for OpenAPI Swagger documentation."""
    user = auth_service.authenticate(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserWithProfileResponse)
def get_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve the current logged-in user profile."""
    return current_user


@router.put("/me/profile", response_model=ProfileResponse)
def update_my_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update career profile for the current user."""
    profile = auth_service.update_profile(db, user_id=current_user.id, profile_in=profile_in)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

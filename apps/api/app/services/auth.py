from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.profile import Profile
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.profile import ProfileUpdate


class AuthService:
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            is_active=True,
            is_superuser=False,
        )
        db.add(db_user)
        db.flush()  # Flush to obtain db_user.id

        # Automatically create linked empty career profile
        db_profile = Profile(
            user_id=db_user.id,
            headline=f"{user_in.full_name or 'Candidate'} - Job Seeker",
            target_roles=[],
            skills=[],
            education=[],
            experience=[],
            projects=[],
            work_authorization={
                "authorized_in_us": True,
                "requires_sponsorship": False,
                "work_visa_status": "Citizen",
            },
            application_answers={},
            experience_years=0.0,
            preferences={
                "locations": [],
                "remote": True,
                "employment_types": ["Full-time"],
                "minimum_salary": None,
            },
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_user)
        return db_user

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def update_profile(
        self, db: Session, user_id: int, profile_in: ProfileUpdate
    ) -> Optional[Profile]:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            profile = Profile(user_id=user_id)
            db.add(profile)

        update_data = profile_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)

        db.commit()
        db.refresh(profile)
        return profile


auth_service = AuthService()

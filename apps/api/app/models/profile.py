from typing import TYPE_CHECKING, Optional, List, Dict, Any
from sqlalchemy import Integer, String, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    headline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    experience_years: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    target_roles: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    skills: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    education: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    experience: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    projects: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    work_authorization: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "authorized_in_us": True,
            "requires_sponsorship": False,
            "work_visa_status": "Citizen",
        },
        nullable=False,
    )
    application_answers: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    preferences: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "locations": [],
            "remote": True,
            "employment_types": ["Full-time"],
            "minimum_salary": None,
        },
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")

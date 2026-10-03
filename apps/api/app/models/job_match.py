from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.user import User


class JobMatch(Base):
    __tablename__ = "job_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    overall_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skill_match: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    experience_match: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    location_match: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    education_match: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    matched_skills: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    missing_requirements: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    job: Mapped["Job"] = relationship("Job", back_populates="matches")
    user: Mapped["User"] = relationship("User", back_populates="matches")

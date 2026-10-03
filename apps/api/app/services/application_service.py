from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User
from app.providers.factory import get_ai_provider
from app.agents.qa import QuestionAnswerAgent
from app.agents.matching import JobMatchingAgent
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob


class ApplicationService:
    """Orchestrates job application lifecycle: creation, AI answer preparation, human review, and submission."""

    def create_application(
        self,
        db: Session,
        user: User,
        job_id: str,
        resume_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Application:
        # Verify job exists
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job '{job_id}' not found.")

        # Check existing application
        existing = (
            db.query(Application)
            .filter(Application.user_id == user.id, Application.job_id == job_id)
            .first()
        )
        if existing:
            return existing

        # Choose primary resume if not provided
        if not resume_id:
            primary_resume = (
                db.query(Resume)
                .filter(Resume.user_id == user.id, Resume.is_primary == True)
                .first()
            )
            if primary_resume:
                resume_id = primary_resume.id

        app_record = Application(
            user_id=user.id,
            job_id=job_id,
            resume_id=resume_id,
            status=ApplicationStatus.SAVED,
            answers={},
            notes=notes,
            automation_logs=[
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "level": "INFO",
                    "message": f"Job saved to application pipeline from source '{job.source}'.",
                }
            ],
        )
        db.add(app_record)
        db.commit()
        db.refresh(app_record)
        return app_record

    async def prepare_application(
        self,
        db: Session,
        application_id: int,
        user: User,
        custom_questions: Optional[List[str]] = None,
    ) -> Application:
        """Prepares application: generates grounded answers for screening questions and sets status to REVIEW."""
        app_record = (
            db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user.id)
            .first()
        )
        if not app_record:
            raise ValueError("Application not found.")

        job = app_record.job
        profile_obj = user.profile
        if not profile_obj:
            raise ValueError("Candidate profile is required to prepare application.")

        pydantic_profile = ProfileBase(
            headline=profile_obj.headline,
            phone=profile_obj.phone,
            location=profile_obj.location,
            bio=profile_obj.bio,
            experience_years=profile_obj.experience_years,
            target_roles=profile_obj.target_roles or [],
            skills=profile_obj.skills or [],
            education=profile_obj.education or [],
            experience=profile_obj.experience or [],
            projects=profile_obj.projects or [],
            work_authorization=profile_obj.work_authorization or {},
            application_answers=profile_obj.application_answers or {},
            preferences=profile_obj.preferences or {},
        )

        normalized_job = NormalizedJob(
            id=job.id,
            title=job.title,
            company=job.company,
            description=job.description,
            location=job.location,
            remote=job.remote,
            employment_type=job.employment_type,
            url=job.url,
            source=job.source,
            tags=job.tags or [],
        )

        ai_provider = get_ai_provider()
        qa_agent = QuestionAnswerAgent(ai_provider=ai_provider)

        # Standard screening questions
        questions_to_ask = [
            "Why are you interested in this role?",
            "Are you authorized to work in this country?",
            "Do you require visa sponsorship now or in the future?",
            "What is your total years of relevant experience?",
            "What is your expected salary?",
        ]
        if custom_questions:
            questions_to_ask.extend(custom_questions)

        prepared_answers: Dict[str, Any] = dict(app_record.answers or {})
        for q in questions_to_ask:
            if q not in prepared_answers:
                result = await qa_agent.answer_screening_question(
                    question=q,
                    profile=pydantic_profile,
                    job=normalized_job,
                    resume_text=app_record.resume.raw_text if app_record.resume else None,
                )
                prepared_answers[q] = result.answer

        # Compute or update match score
        matching_agent = JobMatchingAgent(ai_provider=ai_provider)
        match_eval = await matching_agent.evaluate_match(pydantic_profile, normalized_job)
        app_record.match_score = match_eval.overall_score

        app_record.answers = prepared_answers
        app_record.status = ApplicationStatus.REVIEW
        app_record.prepared_at = datetime.now(timezone.utc)
        
        logs = list(app_record.automation_logs or [])
        logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": "INFO",
            "message": f"Prepared {len(questions_to_ask)} screening question answers. Application transitioned to REVIEW status for candidate approval.",
        })
        app_record.automation_logs = logs

        db.add(app_record)
        db.commit()
        db.refresh(app_record)
        return app_record

    def submit_application(
        self,
        db: Session,
        application_id: int,
        user: User,
        user_confirmed: bool = True,
        submission_notes: Optional[str] = None,
    ) -> Application:
        """Human-in-the-loop application submission. Only completes after user confirmation."""
        if not user_confirmed:
            raise ValueError("Human approval is required before final submission.")

        app_record = (
            db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user.id)
            .first()
        )
        if not app_record:
            raise ValueError("Application not found.")

        app_record.status = ApplicationStatus.APPLIED
        app_record.applied_at = datetime.now(timezone.utc)
        if submission_notes:
            app_record.notes = f"{app_record.notes or ''}\n{submission_notes}".strip()

        logs = list(app_record.automation_logs or [])
        logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": "INFO",
            "message": "Application explicitly reviewed and approved by user. Successfully submitted and marked as APPLIED.",
        })
        app_record.automation_logs = logs

        db.add(app_record)
        db.commit()
        db.refresh(app_record)
        return app_record


application_service = ApplicationService()

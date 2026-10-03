import hashlib
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, urlunparse
from sqlalchemy.orm import Session
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob
from app.jobs.sources.mock import MockJobSource
from app.jobs.sources.remotive import RemotiveJobSource
from app.jobs.sources.arbeitnow import ArbeitnowJobSource
from app.jobs.sources.linkedin import LinkedInJobSource
from app.jobs.sources.ycombinator import YCombinatorJobSource
from app.jobs.sources.wellfound import WellfoundJobSource
from app.jobs.sources.naukri import NaukriJobSource
from app.models.job import Job


def normalize_job_url(raw_url: str) -> str:
    """Normalize URL by stripping tracking parameters (utm_*, ref, etc.) and lowercasing host."""
    try:
        parsed = urlparse(raw_url.strip())
        clean_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip("/"),
            "",
            "",
            "",
        ))
        return clean_url
    except Exception:
        return raw_url.strip()


class JobDiscoveryService:
    """Orchestrates job discovery across multiple sources with deterministic filtering & deduplication."""

    def __init__(self, sources: Optional[List[JobSource]] = None):
        self.sources = sources or [
            LinkedInJobSource(source_name="linkedin"),
            YCombinatorJobSource(source_name="y_combinator"),
            WellfoundJobSource(source_name="wellfound"),
            NaukriJobSource(source_name="naukri"),
            RemotiveJobSource(source_name="remotive"),
            ArbeitnowJobSource(source_name="arbeitnow"),
            MockJobSource(source_name="jobpilot_curated"),
        ]

    async def discover_jobs(
        self,
        db: Session,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
    ) -> List[Job]:
        filters = filters or {}
        discovered: List[NormalizedJob] = []

        # 1. Fetch from sources
        for src in self.sources:
            try:
                jobs = await src.search(query=query, filters=filters, limit=limit)
                discovered.extend(jobs)
            except Exception:
                continue

        # 2. URL normalization & memory deduplication
        seen_urls = set()
        unique_jobs: List[NormalizedJob] = []
        for j in discovered:
            norm_url = normalize_job_url(j.url)
            j.url = norm_url
            if norm_url not in seen_urls:
                seen_urls.add(norm_url)
                unique_jobs.append(j)

        # 3. Deterministic filtering layer (Section 11)
        filtered_jobs: List[NormalizedJob] = []
        for j in unique_jobs:
            # Remote check
            if filters.get("remote") is not None and j.remote != filters["remote"]:
                continue
            # Salary min check
            if filters.get("salary_min") is not None and j.salary_max and j.salary_max < filters["salary_min"]:
                continue
            # Excluded keywords
            excluded = [k.lower() for k in filters.get("excluded_keywords", [])]
            combined = f"{j.title} {j.company} {j.description}".lower()
            if any(k in combined for k in excluded):
                continue

            filtered_jobs.append(j)

        # 4. Upsert/persist into Database
        saved_jobs: List[Job] = []
        for j in filtered_jobs:
            existing = db.query(Job).filter((Job.id == j.id) | (Job.url == j.url)).first()
            if not existing:
                job_record = Job(
                    id=j.id or hashlib.sha256(j.url.encode()).hexdigest()[:16],
                    title=j.title,
                    company=j.company,
                    description=j.description,
                    location=j.location,
                    remote=j.remote,
                    employment_type=j.employment_type,
                    salary_min=j.salary_min,
                    salary_max=j.salary_max,
                    currency=j.currency or "USD",
                    url=j.url,
                    source=j.source,
                    external_id=j.external_id,
                    posted_at=j.posted_at,
                    discovered_at=j.discovered_at,
                    tags=j.tags,
                )
                db.add(job_record)
                db.commit()
                db.refresh(job_record)
                saved_jobs.append(job_record)
            else:
                saved_jobs.append(existing)

        return saved_jobs


job_discovery_service = JobDiscoveryService()

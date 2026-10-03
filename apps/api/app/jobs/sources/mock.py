from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob

SAMPLE_JOBS = [
    {
        "title": "Senior Python Backend Engineer",
        "company": "DataStream Labs",
        "description": "We are seeking a Backend Engineer with strong expertise in Python, FastAPI, PostgreSQL, and Docker. Experience with microservices, Redis caching, and PyTest is required. AWS experience preferred. Must have 3+ years experience.",
        "location": "Remote",
        "remote": True,
        "employment_type": "Full-time",
        "salary_min": 120000.0,
        "salary_max": 150000.0,
        "currency": "USD",
        "url": "https://datastream.careers/jobs/backend-engineer-py",
        "tags": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "PyTest", "AWS"],
    },
    {
        "title": "Full Stack Engineer (React + FastAPI)",
        "company": "Orbit Systems",
        "description": "Looking for a full stack engineer skilled in React, TypeScript, Next.js on the frontend, and Python / FastAPI on the backend. Experience with Tailwind CSS, PostgreSQL, and Docker containerization is required. 2+ years experience.",
        "location": "Remote",
        "remote": True,
        "employment_type": "Full-time",
        "salary_min": 105000.0,
        "salary_max": 135000.0,
        "currency": "USD",
        "url": "https://orbitsystems.io/careers/fullstack-react-fastapi",
        "tags": ["React", "TypeScript", "Next.js", "Python", "FastAPI", "Tailwind CSS", "PostgreSQL"],
    },
    {
        "title": "Frontend Engineer (React / Next.js)",
        "company": "Vivid Interface",
        "description": "Join our product team to craft high-performance web applications using React, Next.js, TypeScript, and Tailwind CSS. Familiarity with Playwright testing and state management is a plus. 2+ years experience.",
        "location": "San Francisco, CA",
        "remote": True,
        "employment_type": "Full-time",
        "salary_min": 115000.0,
        "salary_max": 140000.0,
        "currency": "USD",
        "url": "https://vividui.com/jobs/frontend-engineer",
        "tags": ["React", "TypeScript", "Next.js", "Tailwind CSS", "Playwright"],
    },
    {
        "title": "Cloud DevOps & Platform Engineer",
        "company": "CloudPeak Technologies",
        "description": "We need a Platform Engineer with strong Kubernetes, Docker, CI/CD, AWS, and Linux administration experience. Python or Go scripting required. 4+ years of cloud infrastructure experience.",
        "location": "Austin, TX",
        "remote": False,
        "employment_type": "Full-time",
        "salary_min": 130000.0,
        "salary_max": 165000.0,
        "currency": "USD",
        "url": "https://cloudpeak.io/careers/devops-platform",
        "tags": ["Kubernetes", "Docker", "AWS", "CI/CD", "Linux", "Python", "Go"],
    },
    {
        "title": "AI / Machine Learning Engineer",
        "company": "Nexus Cognitive",
        "description": "Build production LLM pipelines and predictive models. Requirements: Python, PyTorch, Scikit-Learn, FastAPI, Vector Databases, and PostgreSQL. 3+ years experience with machine learning systems.",
        "location": "Remote",
        "remote": True,
        "employment_type": "Full-time",
        "salary_min": 140000.0,
        "salary_max": 180000.0,
        "currency": "USD",
        "url": "https://nexus-ai.dev/careers/ml-engineer",
        "tags": ["Python", "Machine Learning", "Scikit-Learn", "FastAPI", "PostgreSQL", "PyTorch"],
    },
]


class MockJobSource(JobSource):
    """Deterministic mock job discovery source for local testing and development."""

    def __init__(self, source_name: str = "mock_source"):
        super().__init__(source_name=source_name)

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        q = (query or "").lower().strip()
        remote_filter = filters.get("remote")
        min_salary = filters.get("salary_min")

        results: List[NormalizedJob] = []
        for item in SAMPLE_JOBS:
            # Title / description / tags query matching
            if q:
                combined_text = (
                    f"{item['title']} {item['company']} {item['description']} {' '.join(item['tags'])}"
                ).lower()
                if q not in combined_text:
                    continue

            # Remote filter
            if remote_filter is not None and item["remote"] != remote_filter:
                continue

            # Salary filter
            if min_salary is not None and item["salary_max"] and item["salary_max"] < min_salary:
                continue

            job_id = hashlib.sha256(item["url"].encode("utf-8")).hexdigest()[:16]
            results.append(
                NormalizedJob(
                    id=job_id,
                    title=item["title"],
                    company=item["company"],
                    description=item["description"],
                    location=item["location"],
                    remote=item["remote"],
                    employment_type=item["employment_type"],
                    salary_min=item["salary_min"],
                    salary_max=item["salary_max"],
                    currency=item["currency"],
                    url=item["url"],
                    source=self.source_name,
                    external_id=job_id,
                    posted_at=datetime.now(timezone.utc),
                    discovered_at=datetime.now(timezone.utc),
                    tags=item["tags"],
                )
            )
            if len(results) >= limit:
                break

        return results

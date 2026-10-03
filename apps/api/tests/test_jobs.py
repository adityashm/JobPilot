import pytest
from fastapi.testclient import TestClient
from app.services.job_discovery import normalize_job_url, job_discovery_service
from app.jobs.sources.mock import MockJobSource
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob
from app.agents.matching import compute_deterministic_match_signals


def test_url_normalization():
    dirty_url = "HTTPS://Example.COM/jobs/123/?utm_source=linkedin&utm_medium=cpc&ref=xyz"
    clean = normalize_job_url(dirty_url)
    assert clean == "https://example.com/jobs/123"


def test_deterministic_matching_grounding():
    profile = ProfileBase(
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        experience_years=3.5,
        location="Remote",
    )
    job = NormalizedJob(
        title="Senior Python Backend Developer",
        company="TechCorp",
        description="Looking for an engineer skilled in Python, FastAPI, Docker, and AWS. 3+ years experience required.",
        location="Remote",
        remote=True,
        url="https://example.com/jobs/senior-python",
        source="test",
        tags=["Python", "FastAPI", "AWS"],
    )

    match = compute_deterministic_match_signals(profile, job)
    assert match.overall_score >= 70
    assert "Python" in match.matched_skills
    assert "FastAPI" in match.matched_skills
    assert "Docker" in match.matched_skills
    # Grounding check: AWS was required in job description, but candidate doesn't have it!
    # AWS must NOT be in candidate's matched skills
    assert "AWS" not in match.matched_skills
    assert any("AWS" in req for req in match.missing_requirements)
    assert "FastAPI" in match.reasoning


def test_job_search_and_matching_flow(client: TestClient):
    # 1. Register candidate and update skills
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "matcher@example.com", "password": "password123", "full_name": "Matcher User"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.put(
        "/api/v1/profile",
        headers=headers,
        json={
            "headline": "Full Stack Python/React Developer",
            "skills": ["Python", "FastAPI", "PostgreSQL", "React", "Docker"],
            "experience_years": 3.0,
            "location": "Remote",
        },
    )

    # 2. Trigger job search discovery
    search_resp = client.post(
        "/api/v1/jobs/search",
        headers=headers,
        json={"query": "python", "remote": True, "limit": 10},
    )
    assert search_resp.status_code == 200
    jobs = search_resp.json()
    assert len(jobs) > 0
    job_id = jobs[0]["id"]

    # 3. List jobs with query
    list_resp = client.get("/api/v1/jobs?query=python", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 4. Get job detail before matching
    detail_resp = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["match"] is None

    # 5. Run explainable match
    match_resp = client.post(f"/api/v1/jobs/{job_id}/match", headers=headers)
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["overall_score"] > 0
    assert "Python" in match_data["matched_skills"]
    assert match_data["reasoning"] != ""

    # 6. Verify job detail now returns persisted match
    detail_after = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert detail_after.json()["match"] is not None
    assert detail_after.json()["match"]["overall_score"] == match_data["overall_score"]


def test_internship_and_unspecified_experience_matching():
    # Candidate is a student / early-career engineer with 0.1 years of experience
    profile = ProfileBase(
        skills=["Python", "FastAPI", "React", "Docker"],
        experience_years=0.1,
        location="Lucknow",
    )

    # 1. Internship role with short description (no experience specified)
    internship_job = NormalizedJob(
        title="Software Developer Intern",
        company="Alightway Solutions Pvt. Ltd.",
        description="Software Developer Intern position in Lucknow. Python and React fundamentals required.",
        location="Lucknow",
        remote=False,
        url="https://in.linkedin.com/jobs/view/software-developer-intern-4469035656",
        source="LinkedIn",
        tags=["Python", "React"],
    )

    match_intern = compute_deterministic_match_signals(profile, internship_job)
    assert match_intern.experience_match == 100
    assert "2 years" not in match_intern.reasoning
    assert "Internship" in match_intern.reasoning or "student" in match_intern.reasoning
    assert match_intern.overall_score >= 70

    # 2. General role where description does NOT specify required years
    general_job = NormalizedJob(
        title="Software Engineer",
        company="Startup Co",
        description="Looking for an engineer to build products with Python and FastAPI.",
        location="Lucknow",
        remote=False,
        url="https://example.com/job/123",
        source="test",
        tags=["Python", "FastAPI"],
    )
    match_general = compute_deterministic_match_signals(profile, general_job)
    assert match_general.experience_match >= 90
    assert "2 years" not in match_general.reasoning
    assert "No specific years of experience requirement" in match_general.reasoning


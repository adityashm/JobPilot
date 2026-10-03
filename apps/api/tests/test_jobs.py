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

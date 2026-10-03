from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.agents.qa import QuestionAnswerAgent
from app.providers.factory import get_ai_provider
from app.schemas.profile import ProfileBase
from app.jobs.schemas import NormalizedJob
from app.automation.generic import GenericFormAdapter
from app.automation.browser import PlaywrightBrowserManager
from app.models.application import ApplicationStatus


@pytest.mark.anyio
async def test_qa_agent_grounding():
    ai = get_ai_provider("mock")
    qa = QuestionAnswerAgent(ai_provider=ai)

    profile = ProfileBase(
        skills=["Python", "FastAPI", "PostgreSQL"],
        experience_years=4.0,
        work_authorization={"authorized_in_us": True, "requires_sponsorship": False},
        application_answers={"notice_period": "Immediate"},
        preferences={"minimum_salary": 130000},
    )
    job = NormalizedJob(
        title="Backend Engineer",
        company="Acme Corp",
        description="Looking for Python backend developer.",
        location="Remote",
        url="https://example.com/jobs/acme",
        source="test",
    )

    # 1. Deterministic work auth
    ans_auth = await qa.answer_screening_question("Are you legally authorized to work?", profile, job)
    assert ans_auth.answer == "Yes"

    # 2. Deterministic visa sponsorship
    ans_spon = await qa.answer_screening_question("Will you require sponsorship?", profile, job)
    assert ans_spon.answer == "No"

    # 3. Deterministic experience
    ans_exp = await qa.answer_screening_question("What is your total years of experience?", profile, job)
    assert ans_exp.answer == "4"

    # 4. Deterministic salary
    ans_sal = await qa.answer_screening_question("What is your expected salary?", profile, job)
    assert "$130,000" in ans_sal.answer

    # 5. Deterministic relocation
    profile.application_answers["willing_to_relocate"] = "Yes"
    ans_reloc = await qa.answer_screening_question("Are you willing to relocate?", profile, job)
    assert ans_reloc.answer == "Yes"

    # 6. Deterministic location
    profile.location = "San Francisco, CA"
    ans_loc = await qa.answer_screening_question("What is your current location?", profile, job)
    assert ans_loc.answer == "San Francisco, CA"

    # 7. Deterministic linkedin
    profile.linkedin_url = "https://linkedin.com/in/adityashm"
    ans_link = await qa.answer_screening_question("Please provide your LinkedIn profile URL:", profile, job)
    assert ans_link.answer == "https://linkedin.com/in/adityashm"



@pytest.mark.anyio
async def test_playwright_generic_form_automation(tmp_path: Path):
    # Create sample dummy resume file for upload testing
    resume_file = tmp_path / "sample_resume.pdf"
    resume_file.write_bytes(b"%PDF-1.4 dummy resume content")

    mock_form_path = Path(__file__).parent / "mock_form.html"
    assert mock_form_path.exists()
    form_url = mock_form_path.as_uri()

    browser_mgr = PlaywrightBrowserManager()
    try:
        page = await browser_mgr.new_page(headless=True)
        await page.goto(form_url)

        adapter = GenericFormAdapter()
        # 1. Extract fields
        fields = await adapter.extract_fields(page)
        assert len(fields) >= 7

        field_names = [f.name for f in fields]
        assert "full_name" in field_names
        assert "email" in field_names
        assert "resume_upload" in field_names

        # 2. Map fields to profile
        profile = ProfileBase(
            skills=["Python", "FastAPI"],
            phone="(555) 000-1111",
            location="Ghaziabad, India",
            work_authorization={"authorized_in_us": True},
            linkedin_url="https://linkedin.com/in/adityashm",
            github_url="https://github.com/adityashm",
            experience_years=3.0,
        )
        answers = {
            "why_interested": "I am passionate about building scalable Python systems."
        }
        mappings = adapter.map_fields(
            fields=fields,
            profile=profile,
            user_name="Aditya Sharma",
            user_email="aditya@example.com",
            answers=answers,
            resume_path=str(resume_file),
        )
        assert len(mappings) >= 8

        # 3. Fill form
        result = await adapter.fill_fields(page, mappings)
        assert result["filled_count"] >= 8

        # 4. Verify browser values
        full_name_val = await page.input_value("#full_name")
        assert full_name_val == "Aditya Sharma"

        email_val = await page.input_value("#email")
        assert email_val == "aditya@example.com"

        phone_val = await page.input_value("#phone")
        assert phone_val == "(555) 000-1111"

        exp_val = await page.input_value("#experience_years")
        assert exp_val == "3"

        why_val = await page.input_value("#why_interested")
        assert "passionate about building" in why_val

        # Verify element with only name (no id attribute)
        city_val = await page.input_value("input[name='city']")
        assert city_val == "Ghaziabad, India"

        # Verify work authorization mapped directly from profile
        auth_val = await page.input_value("#work_authorization")
        assert auth_val == "Yes"


    finally:
        await browser_mgr.close_session()


def test_application_lifecycle_and_analytics(client: TestClient):
    # 1. Register candidate
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "app_user@example.com", "password": "password123", "full_name": "App User"},
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Setup profile
    client.put(
        "/api/v1/profile",
        headers=headers,
        json={
            "skills": ["Python", "FastAPI", "Docker"],
            "experience_years": 3.0,
            "work_authorization": {"authorized_in_us": True, "requires_sponsorship": False},
        },
    )

    # 2. Discover job
    search_resp = client.post("/api/v1/jobs/search", headers=headers, json={"query": "python"})
    assert search_resp.status_code == 200
    jobs = search_resp.json()
    job_id = jobs[0]["id"]

    # 3. Create application (status=SAVED)
    create_resp = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": job_id, "notes": "Discovered via JobPilot auto-search"},
    )
    assert create_resp.status_code == 201
    app_data = create_resp.json()
    app_id = app_data["id"]
    assert app_data["status"] == ApplicationStatus.SAVED
    assert app_data["job"]["id"] == job_id

    # 4. Prepare application (generates AI screening answers -> status=REVIEW)
    prep_resp = client.post(
        f"/api/v1/applications/{app_id}/prepare",
        headers=headers,
        json={"custom_questions": ["What is your notice period?"]},
    )
    assert prep_resp.status_code == 200
    prep_data = prep_resp.json()
    assert prep_data["status"] == ApplicationStatus.REVIEW
    assert "Are you authorized to work in this country?" in prep_data["answers"]
    assert prep_data["answers"]["Are you authorized to work in this country?"] == "Yes"
    assert len(prep_data["automation_logs"]) >= 2

    # 5. Patch answers / notes during human review
    patch_resp = client.patch(
        f"/api/v1/applications/{app_id}",
        headers=headers,
        json={"notes": "Reviewed and verified answers manually."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["notes"] == "Reviewed and verified answers manually."

    # 6. Human explicit submission -> status=APPLIED
    submit_resp = client.post(
        f"/api/v1/applications/{app_id}/submit",
        headers=headers,
        json={"confirmed": True, "submission_notes": "Approved by user"},
    )
    assert submit_resp.status_code == 200
    submit_data = submit_resp.json()
    assert submit_data["status"] == ApplicationStatus.APPLIED
    assert submit_data["applied_at"] is not None

    # 7. Check Analytics
    analytics_resp = client.get("/api/v1/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    stats = analytics_resp.json()
    assert stats["jobs_discovered"] >= 1
    assert stats["applications_total"] == 1
    assert stats["applications_applied"] == 1
    assert stats["status_breakdown"]["APPLIED"] == 1

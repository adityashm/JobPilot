from fastapi.testclient import TestClient


def test_profile_endpoints_direct(client: TestClient):
    # Register user
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile_direct@example.com",
            "password": "password123",
            "full_name": "Aditya Sharma",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test GET /api/v1/profile
    resp = client.get("/api/v1/profile", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["headline"] == "Aditya Sharma - Job Seeker"
    assert data["skills"] == []
    assert data["education"] == []
    assert data["experience"] == []
    assert data["projects"] == []
    assert data["work_authorization"]["authorized_in_us"] is True

    # Test PUT /api/v1/profile with full structured fields
    update_payload = {
        "headline": "Fullstack & AI Engineer",
        "location": "Ghaziabad, India",
        "skills": ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
        "target_roles": ["Software Engineer", "Backend Developer"],
        "experience_years": 2.0,
        "education": [
            {
                "institution": "IMS Engineering College",
                "degree": "B.Tech CSE",
                "start_year": 2023,
                "end_year": 2027,
            }
        ],
        "experience": [
            {
                "company": "Postix",
                "role": "Founding Engineer",
                "description": "Built AI marketing OS and dashboard",
            }
        ],
        "projects": [
            {
                "name": "CA Audit Assistant",
                "description": "Desktop app with React + FastAPI + PyWebView",
                "technologies": ["Python", "FastAPI", "React"],
            }
        ],
        "work_authorization": {
            "authorized_in_us": True,
            "requires_sponsorship": False,
            "work_visa_status": "Citizen",
        },
        "application_answers": {
            "willing_to_relocate": "Yes",
            "notice_period": "Immediate",
        },
    }
    put_resp = client.put("/api/v1/profile", json=update_payload, headers=headers)
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["headline"] == "Fullstack & AI Engineer"
    assert len(updated["skills"]) == 5
    assert len(updated["education"]) == 1
    assert updated["education"][0]["institution"] == "IMS Engineering College"
    assert len(updated["experience"]) == 1
    assert updated["projects"][0]["name"] == "CA Audit Assistant"
    assert updated["application_answers"]["notice_period"] == "Immediate"

    # Test alias route /api/profile
    alias_resp = client.get("/api/profile", headers=headers)
    assert alias_resp.status_code == 200
    assert alias_resp.json()["headline"] == "Fullstack & AI Engineer"


def test_profile_unauthorized(client: TestClient):
    resp = client.get("/api/v1/profile")
    assert resp.status_code == 401

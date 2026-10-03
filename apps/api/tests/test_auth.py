from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient):
    payload = {
        "email": "testuser@example.com",
        "password": "securepassword123",
        "full_name": "Test User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testuser@example.com"
    assert data["user"]["full_name"] == "Test User"
    assert data["user"]["profile"] is not None
    assert data["user"]["profile"]["headline"] == "Test User - Job Seeker"


def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "securepassword123",
        "full_name": "Original User",
    }
    # First registration
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    # Second registration with same email
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]


def test_register_invalid_password_length(client: TestClient):
    payload = {
        "email": "shortpass@example.com",
        "password": "123",  # Under 6 chars
        "full_name": "Short Pass",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_and_invalid(client: TestClient):
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_test@example.com",
            "password": "correct_password_123",
            "full_name": "Login Test",
        },
    )

    # Valid login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "correct_password_123"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Invalid login
    bad_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "wrong_password"},
    )
    assert bad_resp.status_code == 401


def test_me_and_profile_update(client: TestClient):
    # Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile_user@example.com",
            "password": "password12345",
            "full_name": "Profile User",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get /me
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "profile_user@example.com"
    assert me_data["profile"]["skills"] == []

    # Update profile
    profile_update = {
        "headline": "Senior Fullstack Engineer",
        "location": "Ghaziabad, India",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "target_roles": ["Fullstack Engineer", "Backend Engineer"],
        "experience_years": 3.5,
    }
    update_resp = client.put("/api/v1/auth/me/profile", json=profile_update, headers=headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["headline"] == "Senior Fullstack Engineer"
    assert "FastAPI" in updated_data["skills"]
    assert updated_data["experience_years"] == 3.5

    # Re-fetch /me to confirm persistence
    me_resp2 = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp2.status_code == 200
    assert me_resp2.json()["profile"]["skills"] == ["Python", "FastAPI", "React", "PostgreSQL"]


def test_me_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

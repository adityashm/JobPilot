from fastapi.testclient import TestClient
from app.models.user import User


def test_settings_endpoints(client: TestClient):
    # 1. Register candidate
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "settings_user@example.com", "password": "password123", "full_name": "Settings Tester"},
    )
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get system settings
    get_resp = client.get("/api/v1/settings", headers=headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["project_name"] == "JobPilot API"
    assert "ai" in data
    assert "integrations" in data
    assert data["integrations"]["browser_automation"]["human_in_the_loop"] is True

    # 3. Update AI settings
    patch_resp = client.patch(
        "/api/v1/settings/ai",
        headers=headers,
        json={"provider": "mock", "model": "mock-expert-v1"},
    )
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()
    assert patch_data["ai"]["active_provider"] == "mock"
    assert patch_data["ai"]["model"] == "mock-expert-v1"

    # 4. Invalid provider rejection
    bad_patch = client.patch(
        "/api/v1/settings/ai",
        headers=headers,
        json={"provider": "invalid_provider_xyz"},
    )
    assert bad_patch.status_code == 400

    # 5. Test AI connection ping
    test_ai = client.post("/api/v1/settings/test-ai", headers=headers)
    assert test_ai.status_code == 200
    test_data = test_ai.json()
    assert test_data["status"] == "ok"
    assert test_data["latency_ms"] >= 0

import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.providers.factory import get_ai_provider

router = APIRouter()


class AISettingsUpdate(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    ollama_base_url: Optional[str] = None
    openrouter_api_key: Optional[str] = None


class TestAIResponse(BaseModel):
    status: str
    provider: str
    model: str
    latency_ms: float
    output: str


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any], include_in_schema=False)
def get_system_settings(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve system configuration, AI provider metadata, and active integrations."""
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai": {
            "active_provider": settings.AI_PROVIDER,
            "model": settings.AI_MODEL,
            "ollama_base_url": settings.OLLAMA_BASE_URL,
            "has_openrouter_key": bool(settings.OPENROUTER_API_KEY),
            "available_providers": ["ollama", "openrouter", "mock"],
        },
        "integrations": {
            "remotive": {
                "name": "Remotive Remote Jobs API",
                "status": "active",
                "endpoint": "https://remotive.com/api/remote-jobs",
                "rate_limit": "Public free tier (50 jobs/query)",
            },
            "mock_source": {
                "name": "JobPilot Curated Tech Jobs",
                "status": "active",
                "type": "Deterministic local development dataset",
            },
            "browser_automation": {
                "engine": "Playwright Chromium",
                "status": "ready",
                "headless": True,
                "human_in_the_loop": True,
                "captcha_detection": True,
            },
        },
    }


@router.patch("/ai", response_model=Dict[str, Any])
def update_ai_settings(
    ai_in: AISettingsUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update runtime AI provider configuration."""
    if ai_in.provider is not None:
        allowed = ["ollama", "openrouter", "mock"]
        if ai_in.provider.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid AI provider '{ai_in.provider}'. Allowed: {allowed}",
            )
        settings.AI_PROVIDER = ai_in.provider.lower()

    if ai_in.model is not None and ai_in.model.strip():
        settings.AI_MODEL = ai_in.model.strip()

    if ai_in.ollama_base_url is not None and ai_in.ollama_base_url.strip():
        settings.OLLAMA_BASE_URL = ai_in.ollama_base_url.strip()

    if ai_in.openrouter_api_key is not None:
        key_val = ai_in.openrouter_api_key.strip()
        settings.OPENROUTER_API_KEY = key_val if key_val else None

    return {
        "status": "success",
        "message": "AI settings updated successfully.",
        "ai": {
            "active_provider": settings.AI_PROVIDER,
            "model": settings.AI_MODEL,
            "ollama_base_url": settings.OLLAMA_BASE_URL,
            "has_openrouter_key": bool(settings.OPENROUTER_API_KEY),
        },
    }


@router.post("/test-ai", response_model=TestAIResponse)
async def test_ai_provider_connection(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Send a lightweight verification query to test the active AI provider."""
    start_time = time.perf_counter()
    provider = get_ai_provider()
    prompt = "Ping: respond with 'JobPilot AI engine is operational.'"

    try:
        completion = await provider.complete(
            prompt=prompt,
            system_prompt="You are a healthcheck responder. Output short confirmation.",
            max_tokens=50,
        )
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        return TestAIResponse(
            status="ok",
            provider=settings.AI_PROVIDER,
            model=settings.AI_MODEL,
            latency_ms=latency,
            output=completion.content.strip(),
        )
    except Exception as exc:
        latency = round((time.perf_counter() - start_time) * 1000, 2)
        return TestAIResponse(
            status="error",
            provider=settings.AI_PROVIDER,
            model=settings.AI_MODEL,
            latency_ms=latency,
            output=f"Failed to communicate with provider: {str(exc)}",
        )

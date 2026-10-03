import pytest
from pydantic import BaseModel
from app.providers.factory import get_ai_provider
from app.providers.mock import MockAIProvider
from app.providers.ollama import OllamaProvider
from app.providers.openrouter import OpenRouterProvider


class DummySchema(BaseModel):
    summary: str = "default summary"
    score: int = 100


@pytest.mark.anyio
async def test_mock_ai_provider():
    provider = get_ai_provider(provider_name="mock", model="test-model")
    assert isinstance(provider, MockAIProvider)
    assert provider.provider_name == "mock"

    res = await provider.complete(prompt="Hello JobPilot")
    assert res.provider == "mock"
    assert "Mock response" in res.content
    assert res.latency_ms > 0

    structured = await provider.structured_output(prompt="Extract data", schema=DummySchema)
    assert isinstance(structured, DummySchema)
    assert structured.summary == "default summary"
    assert structured.score == 100


def test_ollama_provider_instantiation():
    provider = get_ai_provider(provider_name="ollama", model="llama3")
    assert isinstance(provider, OllamaProvider)
    assert provider.provider_name == "ollama"
    assert provider.model == "llama3"


def test_openrouter_provider_missing_key():
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY environment variable is required"):
        get_ai_provider(provider_name="openrouter")


def test_invalid_provider_raises():
    with pytest.raises(ValueError, match="Unsupported AI provider"):
        get_ai_provider(provider_name="unknown_cloud")

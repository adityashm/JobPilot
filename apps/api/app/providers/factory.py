from typing import Optional
from app.core.config import settings
from app.providers.base import BaseAIProvider
from app.providers.ollama import OllamaProvider
from app.providers.openrouter import OpenRouterProvider
from app.providers.mock import MockAIProvider


def get_ai_provider(
    provider_name: Optional[str] = None,
    model: Optional[str] = None,
) -> BaseAIProvider:
    """Factory creating an AI Provider based on settings or explicit parameters."""
    provider_type = (provider_name or settings.AI_PROVIDER).lower().strip()
    target_model = model or settings.AI_MODEL

    if provider_type == "ollama":
        return OllamaProvider(
            model=target_model,
            base_url=settings.OLLAMA_BASE_URL,
        )
    elif provider_type == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is required when AI_PROVIDER='openrouter'."
            )
        return OpenRouterProvider(
            api_key=settings.OPENROUTER_API_KEY,
            model=target_model,
        )
    elif provider_type in ("mock", "test"):
        return MockAIProvider(model=target_model)
    else:
        raise ValueError(
            f"Unsupported AI provider: '{provider_type}'. Supported providers: 'ollama', 'openrouter', 'mock'."
        )

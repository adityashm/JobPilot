from abc import ABC, abstractmethod
import time
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T", bound=BaseModel)


class AICompletionResponse(BaseModel):
    content: str
    model: str
    provider: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0
    raw_response: Optional[Dict[str, Any]] = None


class BaseAIProvider(ABC):
    """Abstract base class for all AI LLM providers (Ollama, OpenRouter, etc.)."""

    def __init__(self, model: str):
        self.model = model

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of provider (e.g. 'ollama', 'openrouter', 'mock')."""
        pass

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> AICompletionResponse:
        """Generate text completion from LLM."""
        pass

    @abstractmethod
    async def structured_output(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        **kwargs: Any,
    ) -> T:
        """Generate structured Pydantic model response."""
        pass

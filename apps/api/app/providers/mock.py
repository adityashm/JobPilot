import time
from typing import Any, Optional, Type, TypeVar
from pydantic import BaseModel
from app.providers.base import BaseAIProvider, AICompletionResponse

T = TypeVar("T", bound=BaseModel)


class MockAIProvider(BaseAIProvider):
    """Deterministic mock provider for testing and offline development."""

    def __init__(self, model: str = "mock-gpt"):
        super().__init__(model=model)

    @property
    def provider_name(self) -> str:
        return "mock"

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> AICompletionResponse:
        return AICompletionResponse(
            content=f"Mock response for: {prompt[:40]}...",
            model=self.model,
            provider=self.provider_name,
            prompt_tokens=10,
            completion_tokens=20,
            latency_ms=1.5,
            raw_response={"mock": True},
        )

    async def structured_output(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        **kwargs: Any,
    ) -> T:
        # Construct schema default or minimal instance
        defaults = {}
        for name, field in schema.model_fields.items():
            if field.default is not None and field.default is not ...:
                defaults[name] = field.default
            elif field.default_factory is not None:
                defaults[name] = field.default_factory()
            else:
                defaults[name] = None
        return schema.model_validate(defaults)

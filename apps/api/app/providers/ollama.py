import json
import time
from typing import Any, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel
from app.providers.base import BaseAIProvider, AICompletionResponse

T = TypeVar("T", bound=BaseModel)


class OllamaProvider(BaseAIProvider):
    """Local Ollama AI Provider for zero-cost local LLM inference."""

    def __init__(self, model: str = "llama3", base_url: str = "http://localhost:11434"):
        super().__init__(model=model)
        self.base_url = base_url.rstrip("/")

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> AICompletionResponse:
        start_time = time.time()
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()

        latency_ms = (time.time() - start_time) * 1000
        return AICompletionResponse(
            content=data.get("response", ""),
            model=self.model,
            provider=self.provider_name,
            prompt_tokens=data.get("prompt_eval_count", 0),
            completion_tokens=data.get("eval_count", 0),
            latency_ms=latency_ms,
            raw_response=data,
        )

    async def structured_output(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1,
        **kwargs: Any,
    ) -> T:
        schema_json = json.dumps(schema.model_json_schema())
        augmented_system = (
            f"{system_prompt or ''}\nYou MUST reply with valid JSON adhering strictly to this schema:\n{schema_json}"
        )

        start_time = time.time()
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": temperature},
            "system": augmented_system,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data.get("response", "{}")
        parsed = json.loads(content)
        return schema.model_validate(parsed)

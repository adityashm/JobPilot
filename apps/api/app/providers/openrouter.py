import json
import time
from typing import Any, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel
from app.providers.base import BaseAIProvider, AICompletionResponse

T = TypeVar("T", bound=BaseModel)


class OpenRouterProvider(BaseAIProvider):
    """OpenRouter API Provider for multi-model cloud LLM access."""

    def __init__(self, api_key: str, model: str = "anthropic/claude-3.5-sonnet"):
        super().__init__(model=model)
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"

    @property
    def provider_name(self) -> str:
        return "openrouter"

    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        **kwargs: Any,
    ) -> AICompletionResponse:
        start_time = time.time()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://github.com/adityashm/JobPilot",
            "X-Title": "JobPilot Assistant",
            "Content-Type": "application/json",
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        latency_ms = (time.time() - start_time) * 1000
        choice = data.get("choices", [{}])[0]
        content = choice.get("message", {}).get("content", "")
        usage = data.get("usage", {})

        return AICompletionResponse(
            content=content,
            model=self.model,
            provider=self.provider_name,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
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
            f"{system_prompt or ''}\nYou MUST return a JSON object adhering strictly to this schema:\n{schema_json}"
        )

        res = await self.complete(
            prompt=prompt,
            system_prompt=augmented_system,
            temperature=temperature,
            **kwargs,
        )
        content = res.content.strip()
        # Strip markdown fences if present
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        parsed = json.loads(content.strip())
        return schema.model_validate(parsed)

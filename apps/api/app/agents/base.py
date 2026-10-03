from abc import ABC, abstractmethod
from typing import Any, Optional
from app.providers.base import BaseAIProvider
from app.providers.factory import get_ai_provider


class BaseAgent(ABC):
    """Abstract base class for all specialized domain agents."""

    def __init__(self, ai_provider: Optional[BaseAIProvider] = None):
        self.ai_provider = ai_provider or get_ai_provider()

    @property
    @abstractmethod
    def name(self) -> str:
        """Agent identifier."""
        pass

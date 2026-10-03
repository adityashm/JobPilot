from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.jobs.schemas import NormalizedJob


class JobSource(ABC):
    """Abstract base class for legitimate job sources (API, RSS, public boards)."""

    def __init__(self, source_name: str):
        self.source_name = source_name

    @abstractmethod
    async def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
    ) -> List[NormalizedJob]:
        """Search and return normalized job listings."""
        pass

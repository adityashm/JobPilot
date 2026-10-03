from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class FormField(BaseModel):
    field_id: str
    name: Optional[str] = None
    label: Optional[str] = None
    tag: str
    input_type: Optional[str] = None
    is_required: bool = False
    options: List[str] = []
    current_value: Optional[str] = None
    confidence: float = 1.0


class FieldMappingResult(BaseModel):
    field_id: str
    name: Optional[str] = None
    target_profile_path: Optional[str] = None
    mapped_value: Optional[Any] = None
    requires_human_review: bool = False
    reason: Optional[str] = None



class BaseApplicationAdapter(ABC):
    """Abstract adapter for specific ATS/Job board application portals."""

    @abstractmethod
    async def detect(self, page_content: str, url: str) -> bool:
        """Return True if this adapter recognizes the target application portal."""
        pass

    @abstractmethod
    async def extract_fields(self, page: Any) -> List[FormField]:
        """Detect and extract form fields from the current DOM state."""
        pass

    @abstractmethod
    async def fill_fields(self, page: Any, mappings: List[FieldMappingResult]) -> Dict[str, Any]:
        """Fill supported form inputs with candidate data."""
        pass


class BrowserManager(ABC):
    """Browser session controller for Playwright-based automation."""

    @abstractmethod
    async def launch_session(self, headless: bool = True) -> Any:
        pass

    @abstractmethod
    async def close_session(self) -> None:
        pass

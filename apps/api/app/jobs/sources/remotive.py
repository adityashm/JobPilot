from datetime import datetime, timezone
import hashlib
import re
from typing import Any, Dict, List, Optional
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class RemotiveJobSource(JobSource):
    """Legitimate public job board source utilizing Remotive's free public remote jobs API."""

    def __init__(self, source_name: str = "remotive"):
        super().__init__(source_name=source_name)
        self.api_url = "https://remotive.com/api/remote-jobs"

    def _strip_html(self, text: str) -> str:
        if not text:
            return ""
        clean = re.sub(r"<[^>]+>", " ", text)
        clean = re.sub(r"\s+", " ", clean)
        return clean.strip()

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        params: Dict[str, Any] = {"limit": min(limit, 50)}
        if query:
            params["search"] = query

        results: List[NormalizedJob] = []
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(self.api_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    jobs_list = data.get("jobs", [])
                    for j in jobs_list[:limit]:
                        ext_id = str(j.get("id"))
                        url = j.get("url") or f"https://remotive.com/job/{ext_id}"
                        job_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
                        desc_text = self._strip_html(j.get("description", ""))

                        posted = None
                        if j.get("publication_date"):
                            try:
                                posted = datetime.fromisoformat(j["publication_date"].replace("Z", "+00:00"))
                            except Exception:
                                posted = datetime.now(timezone.utc)

                        results.append(
                            NormalizedJob(
                                id=job_id,
                                title=j.get("title", "Software Engineer"),
                                company=j.get("company_name", "Technology Company"),
                                description=desc_text[:3000],
                                location=j.get("candidate_required_location") or "Worldwide / Remote",
                                remote=True,
                                employment_type=j.get("job_type", "Full-time"),
                                salary_min=None,
                                salary_max=None,
                                currency="USD",
                                url=url,
                                source=self.source_name,
                                external_id=ext_id,
                                posted_at=posted,
                                discovered_at=datetime.now(timezone.utc),
                                tags=j.get("tags", []),
                            )
                        )
        except Exception:
            # Fallback gracefully if internet access is offline or rate-limited
            pass

        return results

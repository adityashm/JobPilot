from datetime import datetime, timezone
import hashlib
import re
from typing import Any, Dict, List, Optional
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class ArbeitnowJobSource(JobSource):
    """Legitimate public job board source utilizing Arbeitnow's public job board API."""

    def __init__(self, source_name: str = "arbeitnow"):
        super().__init__(source_name=source_name)
        self.api_url = "https://www.arbeitnow.com/api/job-board-api"

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
        results: List[NormalizedJob] = []
        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "JobPilot/1.0"}) as client:
                resp = await client.get(self.api_url)
                if resp.status_code == 200:
                    data = resp.json()
                    jobs_list = data.get("data", [])
                    q_lower = query.lower().strip() if query else ""

                    for j in jobs_list:
                        title = j.get("title", "")
                        company = j.get("company_name", "")
                        desc_text = self._strip_html(j.get("description", ""))
                        tags = j.get("tags", [])

                        # Query filtering if provided
                        if q_lower:
                            combined = f"{title} {company} {' '.join(tags)} {desc_text[:500]}".lower()
                            if q_lower not in combined:
                                continue

                        url = j.get("url") or f"https://www.arbeitnow.com/view/{j.get('slug')}"
                        job_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

                        posted = None
                        if j.get("created_at"):
                            try:
                                posted = datetime.fromtimestamp(j["created_at"], tz=timezone.utc)
                            except Exception:
                                posted = datetime.now(timezone.utc)

                        results.append(
                            NormalizedJob(
                                id=job_id,
                                title=title,
                                company=company,
                                description=desc_text[:3000],
                                location=j.get("location") or "Remote / Europe / Worldwide",
                                remote=bool(j.get("remote", False)),
                                employment_type=j.get("job_types", ["Full-time"])[0] if j.get("job_types") else "Full-time",
                                salary_min=None,
                                salary_max=None,
                                currency="EUR",
                                url=url,
                                source=self.source_name,
                                external_id=j.get("slug"),
                                posted_at=posted,
                                discovered_at=datetime.now(timezone.utc),
                                tags=tags,
                            )
                        )
                        if len(results) >= limit:
                            break
        except Exception:
            pass

        return results

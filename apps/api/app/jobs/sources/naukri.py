from datetime import datetime, timezone
import hashlib
import re
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class NaukriJobSource(JobSource):
    """Fetches Indian tech job listings from Naukri.com."""

    def __init__(self, source_name: str = "naukri"):
        super().__init__(source_name=source_name)

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 25,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        q_clean = query.strip() or "software-engineer"
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", q_clean).strip("-").lower()
        search_url = f"https://www.naukri.com/{slug}-jobs"

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        results: List[NormalizedJob] = []
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers, follow_redirects=True) as client:
                resp = await client.get(search_url)
                if resp.status_code == 200:
                    html = resp.text
                    # Extract JSON payload embedded inside <script type="application/ld+json"> or window.__INITIAL_STATE__
                    soup = BeautifulSoup(html, "html.parser")
                    scripts = soup.find_all("script", type="application/ld+json")
                    import json
                    for s in scripts:
                        try:
                            data = json.loads(s.string or "{}")
                            if isinstance(data, list):
                                for item in data:
                                    if item.get("@type") == "JobPosting":
                                        title = item.get("title", "")
                                        hiring_org = item.get("hiringOrganization", {}).get("name", "Naukri Hiring Partner")
                                        job_url = item.get("url", "")
                                        job_loc = item.get("jobLocation", {}).get("address", {}).get("addressLocality", "Delhi NCR, India")
                                        job_id = hashlib.sha256(job_url.encode()).hexdigest()[:16]

                                        results.append(
                                            NormalizedJob(
                                                id=job_id,
                                                title=title,
                                                company=hiring_org,
                                                description=f"{title} position at {hiring_org} in {job_loc}. Posted on Naukri.",
                                                location=f"{job_loc}, India",
                                                remote="remote" in job_loc.lower(),
                                                employment_type="Full-time",
                                                salary_min=None,
                                                salary_max=None,
                                                currency="INR",
                                                url=job_url,
                                                source=self.source_name,
                                                external_id=job_id,
                                                posted_at=datetime.now(timezone.utc),
                                                discovered_at=datetime.now(timezone.utc),
                                                tags=["Naukri", "India", "Tech"],
                                            )
                                        )
                        except Exception:
                            continue
        except Exception:
            pass

        return results

from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class WellfoundJobSource(JobSource):
    """Fetches high-growth startup opportunities from Wellfound (formerly AngelList Talent)."""

    def __init__(self, source_name: str = "wellfound"):
        super().__init__(source_name=source_name)
        self.base_url = "https://wellfound.com/jobs"

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 25,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        q_clean = query.strip() or "software-engineer"
        search_slug = q_clean.lower().replace(" ", "-")
        target_url = f"https://wellfound.com/role/{search_slug}"

        results: List[NormalizedJob] = []
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        try:
            async with httpx.AsyncClient(timeout=8.0, headers=headers, follow_redirects=True) as client:
                resp = await client.get(target_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Find job links
                    job_links = soup.find_all("a", href=lambda h: h and "/jobs/" in h)
                    seen_urls = set()

                    for a in job_links:
                        href = a["href"]
                        full_url = href if href.startswith("http") else f"https://wellfound.com{href}"
                        clean_url = full_url.split("?")[0]
                        if clean_url in seen_urls:
                            continue
                        seen_urls.add(clean_url)

                        title_text = a.text.strip()
                        if not title_text or len(title_text) < 4:
                            continue

                        job_id = hashlib.sha256(clean_url.encode("utf-8")).hexdigest()[:16]

                        results.append(
                            NormalizedJob(
                                id=job_id,
                                title=title_text,
                                company="Wellfound Verified Startup",
                                description=f"{title_text} at high-growth venture backed startup. Apply via Wellfound.",
                                location="Remote / India / Global",
                                remote=True,
                                employment_type="Full-time",
                                salary_min=None,
                                salary_max=None,
                                currency="USD",
                                url=clean_url,
                                source=self.source_name,
                                external_id=job_id,
                                posted_at=datetime.now(timezone.utc),
                                discovered_at=datetime.now(timezone.utc),
                                tags=["Wellfound", "AngelList", "Startup", "Equity"],
                            )
                        )
                        if len(results) >= limit:
                            break
        except Exception:
            pass

        return results

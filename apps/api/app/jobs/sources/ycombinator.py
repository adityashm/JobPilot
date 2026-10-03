from datetime import datetime, timezone
import hashlib
import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class YCombinatorJobSource(JobSource):
    """Fetches verified startup job postings directly from Y Combinator's job feed."""

    def __init__(self, source_name: str = "y_combinator"):
        super().__init__(source_name=source_name)
        self.news_jobs_url = "https://news.ycombinator.com/jobs"

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 30,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        q_lower = query.lower().strip() if query else ""

        results: List[NormalizedJob] = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
                resp = await client.get(self.news_jobs_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for span in soup.find_all("span", class_="titleline"):
                        a = span.find("a")
                        if not a:
                            continue

                        raw_title = a.text.strip()
                        url = a.get("href", "")

                        # Filter by query if provided
                        if q_lower and q_lower not in raw_title.lower():
                            continue

                        # Extract Company Name (patterns like "Company (YC XX) Is Hiring...")
                        company = "YC Startup"
                        batch_tag = "Y Combinator"
                        batch_match = re.search(r"\((YC\s*[WS]\d{2})\)", raw_title, re.IGNORECASE)
                        if batch_match:
                            batch_tag = batch_match.group(1).upper()

                        if " is hiring" in raw_title.lower():
                            parts = re.split(r"\s+is\s+hiring\s+", raw_title, flags=re.IGNORECASE)
                            company = re.sub(r"\s*\(YC[^\)]+\)", "", parts[0]).strip()
                            clean_title = parts[1].strip() if len(parts) > 1 else raw_title
                        else:
                            clean_title = raw_title

                        job_id = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

                        results.append(
                            NormalizedJob(
                                id=job_id,
                                title=clean_title,
                                company=company,
                                description=f"{raw_title}. Y Combinator backed startup position. Apply directly via company portal.",
                                location="Remote / US / Global",
                                remote=True,
                                employment_type="Full-time",
                                salary_min=None,
                                salary_max=None,
                                currency="USD",
                                url=url,
                                source=self.source_name,
                                external_id=job_id,
                                posted_at=datetime.now(timezone.utc),
                                discovered_at=datetime.now(timezone.utc),
                                tags=["Y Combinator", batch_tag, "Startup"],
                            )
                        )
                        if len(results) >= limit:
                            break
        except Exception:
            pass

        return results

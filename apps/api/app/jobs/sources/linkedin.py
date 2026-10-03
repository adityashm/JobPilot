from datetime import datetime, timezone
import hashlib
from typing import Any, Dict, List, Optional
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import httpx
from app.jobs.base import JobSource
from app.jobs.schemas import NormalizedJob


class LinkedInJobSource(JobSource):
    """Fetches real live job postings from LinkedIn via their public guest job search endpoint."""

    def __init__(self, source_name: str = "linkedin"):
        super().__init__(source_name=source_name)
        self.base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

    async def search(
        self,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 25,
    ) -> List[NormalizedJob]:
        filters = filters or {}
        search_query = query.strip() or "Software Engineer"
        location = filters.get("location") or "India"

        params = {
            "keywords": search_query,
            "location": location,
            "start": 0,
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }

        results: List[NormalizedJob] = []
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True) as client:
                resp = await client.get(self.base_url, params=params)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for card in soup.find_all("li"):
                        title_el = card.find("h3", class_="base-search-card__title")
                        company_el = card.find("h4", class_="base-search-card__subtitle")
                        loc_el = card.find("span", class_="job-search-card__location")
                        link_el = card.find("a", class_="base-card__full-link")
                        time_el = card.find("time")

                        if not title_el or not company_el:
                            continue

                        title = title_el.text.strip()
                        company = company_el.text.strip()
                        job_location = loc_el.text.strip() if loc_el else location
                        raw_url = link_el["href"] if link_el and "href" in link_el.attrs else ""
                        clean_url = raw_url.split("?")[0] if raw_url else f"https://www.linkedin.com/jobs/search/?keywords={quote_plus(search_query)}"

                        job_id = hashlib.sha256(clean_url.encode("utf-8")).hexdigest()[:16]

                        posted = datetime.now(timezone.utc)
                        if time_el and "datetime" in time_el.attrs:
                            try:
                                posted = datetime.fromisoformat(time_el["datetime"].replace("Z", "+00:00"))
                            except Exception:
                                pass

                        is_remote = "remote" in job_location.lower() or "remote" in title.lower()

                        results.append(
                            NormalizedJob(
                                id=job_id,
                                title=title,
                                company=company,
                                description=f"{title} position at {company} in {job_location}. Apply directly via LinkedIn.",
                                location=job_location,
                                remote=is_remote,
                                employment_type="Full-time",
                                salary_min=None,
                                salary_max=None,
                                currency="INR" if "india" in job_location.lower() else "USD",
                                url=clean_url,
                                source=self.source_name,
                                external_id=job_id,
                                posted_at=posted,
                                discovered_at=datetime.now(timezone.utc),
                                tags=["LinkedIn", "Tech"],
                            )
                        )
                        if len(results) >= limit:
                            break
        except Exception:
            pass

        return results

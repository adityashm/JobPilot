from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from app.automation.base import BrowserManager, BaseApplicationAdapter, FormField, FieldMappingResult
from app.automation.generic import GenericFormAdapter
from app.automation.adapters.greenhouse import GreenhouseAdapter
from app.automation.adapters.lever import LeverAdapter
from app.schemas.profile import ProfileBase

BROWSER_PROFILE_DIR = Path("data/browser_profile")
BROWSER_PROFILE_DIR.mkdir(parents=True, exist_ok=True)


class PlaywrightBrowserManager(BrowserManager):
    """Manages browser sessions using Playwright with persistent context and anti-detection flags."""

    def __init__(self):
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self.adapters: List[BaseApplicationAdapter] = [
            GreenhouseAdapter(),
            LeverAdapter(),
            GenericFormAdapter(),
        ]

    async def launch_session(
        self,
        headless: bool = False,
        use_persistent_profile: bool = True,
    ) -> BrowserContext:
        """Launches a browser session. Defaults to headed with persistent profile to prevent CAPTCHAs."""
        if not self._playwright:
            self._playwright = await async_playwright().start()

        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-infobars",
        ]

        if use_persistent_profile:
            self._context = await self._playwright.chromium.launch_persistent_context(
                user_data_dir=str(BROWSER_PROFILE_DIR.resolve()),
                headless=headless,
                args=args,
                viewport={"width": 1280, "height": 850},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )
        else:
            if not self._browser:
                self._browser = await self._playwright.chromium.launch(
                    headless=headless,
                    args=args,
                )
            self._context = await self._browser.new_context(
                viewport={"width": 1280, "height": 850},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )

        return self._context

    async def new_page(self, headless: bool = False) -> Page:
        if not self._context:
            await self.launch_session(headless=headless)
        if self._context.pages:
            return self._context.pages[0]
        return await self._context.new_page()

    async def autofill_application(
        self,
        url: str,
        profile: ProfileBase,
        user_name: str,
        user_email: str,
        answers: Dict[str, Any],
        resume_path: Optional[str] = None,
        headless: bool = False,
    ) -> Dict[str, Any]:
        """Runs the automated field mapping and form-fill loop against the live application portal."""
        logs: List[Dict[str, str]] = []

        def log(level: str, msg: str):
            logs.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": level,
                "message": msg,
            })

        log("INFO", f"Launching assisted browser session (Headless={headless})...")
        context = await self.launch_session(headless=headless, use_persistent_profile=True)
        page = context.pages[0] if context.pages else await context.new_page()

        try:
            log("INFO", f"Navigating to application URL: {url[:70]}...")
            await page.goto(url, timeout=25000, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)

            content = await page.content()

            # 1. Detect which adapter to use
            active_adapter: BaseApplicationAdapter = self.adapters[-1]  # Default to generic
            for adapter in self.adapters:
                if await adapter.detect(content, url):
                    active_adapter = adapter
                    break

            log("INFO", f"Active ATS adapter identified: {active_adapter.__class__.__name__}")

            # 2. Check for CAPTCHA or verification challenge
            if hasattr(active_adapter, "check_for_captcha_or_challenge"):
                challenge = active_adapter.check_for_captcha_or_challenge(content)
                if challenge:
                    log("WARNING", f"Human verification required: {challenge}. Please complete it in the visible browser window.")
                    return {
                        "status": "PAUSED_FOR_VERIFICATION",
                        "challenge": challenge,
                        "filled_count": 0,
                        "review_count": 1,
                        "logs": logs,
                    }

            # 3. Extract interactive form fields
            fields = await active_adapter.extract_fields(page)
            log("INFO", f"Detected {len(fields)} interactive form fields.")

            # 4. Map fields deterministically against candidate profile
            generic = GenericFormAdapter()
            mappings = generic.map_fields(
                fields=fields,
                profile=profile,
                user_name=user_name,
                user_email=user_email,
                answers=answers,
                resume_path=resume_path,
            )

            # 5. Fill fields
            fill_result = await active_adapter.fill_fields(page, mappings)
            log("SUCCESS", f"Successfully auto-filled {fill_result['filled_count']} fields.")
            if fill_result["review_count"] > 0:
                log("INFO", f"{fill_result['review_count']} fields require human review.")

            log("INFO", "Pausing application state for candidate review before submission.")

            return {
                "status": "PREPARED_FOR_REVIEW",
                "filled_count": fill_result["filled_count"],
                "review_count": fill_result["review_count"],
                "adapter": active_adapter.__class__.__name__,
                "logs": logs,
            }

        except Exception as e:
            log("ERROR", f"Browser automation error: {str(e)}")
            return {
                "status": "ERROR",
                "error": str(e),
                "filled_count": 0,
                "review_count": 0,
                "logs": logs,
            }

    async def close_session(self) -> None:
        if self._context:
            try:
                await self._context.close()
            except Exception:
                pass
            self._context = None
        if self._browser:
            try:
                await self._browser.close()
            except Exception:
                pass
            self._browser = None
        if self._playwright:
            try:
                await self._playwright.stop()
            except Exception:
                pass
            self._playwright = None


_browser_manager_instance: Optional[PlaywrightBrowserManager] = None


def get_browser_manager() -> PlaywrightBrowserManager:
    """Returns singleton browser manager to preserve open headed context and avoid profile lock conflicts."""
    global _browser_manager_instance
    if _browser_manager_instance is None:
        _browser_manager_instance = PlaywrightBrowserManager()
    return _browser_manager_instance


from typing import Any, Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from app.automation.base import BrowserManager


class PlaywrightBrowserManager(BrowserManager):
    """Manages browser sessions using Playwright for controlled application automation."""

    def __init__(self):
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None

    async def launch_session(self, headless: bool = True) -> BrowserContext:
        if not self._playwright:
            self._playwright = await async_playwright().start()
        if not self._browser:
            self._browser = await self._playwright.chromium.launch(
                headless=headless,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
        self._context = await self._browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
        )
        return self._context

    async def new_page(self, headless: bool = True) -> Page:
        if not self._context:
            await self.launch_session(headless=headless)
        return await self._context.new_page()

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

"""
Browser Scraper Module for Agent Zero
Playwright-based browser automation for research workflows.
"""

import os
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from loguru import logger

try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not installed. Run: pip install playwright && playwright install chromium")


class BrowserScraper:
    """
    Advanced browser automation for Agent Zero.
    Handles web scraping, login automation, and NotebookLM uploads.
    """
    
    def __init__(self, profile_path: str = "./data/browser_profile"):
        self.profile_path = Path(profile_path)
        self.profile_path.mkdir(parents=True, exist_ok=True)
        
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        
        self.headless = os.getenv("BROWSER_HEADLESS", "true").lower() == "true"
        self.timeout = int(os.getenv("BROWSER_TIMEOUT", "30000"))
    
    async def start(self) -> bool:
        """Initialize browser with persistent profile."""
        if not PLAYWRIGHT_AVAILABLE:
            logger.error("Playwright not available")
            return False
        
        try:
            self.playwright = await async_playwright().start()
            
            # Use persistent context for cookie storage
            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=str(self.profile_path),
                headless=self.headless,
                viewport={"width": 1280, "height": 800},
                args=["--disable-blink-features=AutomationControlled"]
            )
            
            self.page = await self.context.new_page()
            self.page.set_default_timeout(self.timeout)
            
            # Apply Stealth
            try:
                from agent_zero.libs.stealth import stealth_async, StealthConfig
                await stealth_async(self.page)
                logger.info("Stealth mode enabled")
            except Exception as e:
                logger.warning(f"Failed to enable stealth mode: {e}")

            logger.info("Browser started with persistent profile")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            return False
    
    async def close(self):
        """Close browser and save state."""
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Browser closed")
    
    async def scrape_page(self, url: str, wait_for: str = "body") -> Dict[str, Any]:
        """
        Scrape content from a URL.
        
        Args:
            url: Target URL
            wait_for: CSS selector to wait for
            
        Returns:
            Dict with title, content, html, url
        """
        if not self.page:
            await self.start()
        
        try:
            await self.page.goto(url, wait_until="domcontentloaded")
            await self.page.wait_for_selector(wait_for, timeout=10000)
            
            title = await self.page.title()
            content = await self.page.evaluate("""
                () => {
                    // Remove scripts, styles, nav, footer
                    ['script', 'style', 'nav', 'footer', 'header', 'aside'].forEach(tag => {
                        document.querySelectorAll(tag).forEach(el => el.remove());
                    });
                    return document.body.innerText;
                }
            """)
            
            return {
                "url": url,
                "title": title,
                "content": content[:50000],  # Limit content size
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Scrape failed for {url}: {e}")
            return {"url": url, "success": False, "error": str(e)}
    
    async def download_pdf(self, url: str, download_path: str = "./downloads") -> Optional[str]:
        """
        Download a PDF from URL.
        
        Args:
            url: PDF URL
            download_path: Directory to save PDF
            
        Returns:
            Path to downloaded file or None
        """
        if not self.page:
            await self.start()
        
        download_dir = Path(download_path)
        download_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            async with self.page.expect_download() as download_info:
                await self.page.goto(url)
            
            download = await download_info.value
            file_path = download_dir / download.suggested_filename
            await download.save_as(str(file_path))
            
            logger.info(f"Downloaded: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return None
    
    async def login_google(self, email: str, password: str) -> bool:
        """
        Login to Google account (for NotebookLM access).
        Saves session cookies for future use.
        
        Args:
            email: Google email
            password: App password (not regular password!)
            
        Returns:
            True if login successful
        """
        if not self.page:
            await self.start()
        
        try:
            await self.page.goto("https://accounts.google.com/signin")
            
            # Enter email
            await self.page.fill('input[type="email"]', email)
            await self.page.click('#identifierNext')
            await self.page.wait_for_timeout(2000)
            
            # Enter password
            await self.page.fill('input[type="password"]', password)
            await self.page.click('#passwordNext')
            await self.page.wait_for_timeout(3000)
            
            # Check if login successful
            if "myaccount.google.com" in self.page.url or "accounts.google.com/signin/v2/challenge" not in self.page.url:
                logger.info("Google login successful")
                return True
            else:
                logger.warning("Google login may have failed or requires 2FA")
                return False
                
        except Exception as e:
            logger.error(f"Google login failed: {e}")
            return False
    
    async def check_google_session(self) -> bool:
        """Check if Google session is still valid."""
        if not self.page:
            await self.start()
        
        try:
            await self.page.goto("https://myaccount.google.com")
            await self.page.wait_for_timeout(2000)
            
            # If we're on myaccount, session is valid
            return "myaccount.google.com" in self.page.url
            
        except:
            return False
    
    async def upload_to_notebooklm(self, files: List[str], notebook_name: str = "Research") -> Optional[str]:
        """
        Upload documents to NotebookLM.
        
        Args:
            files: List of file paths to upload
            notebook_name: Name for the notebook
            
        Returns:
            NotebookLM URL or None
        """
        if not self.page:
            await self.start()
        
        # Check Google session
        if not await self.check_google_session():
            logger.error("Not logged into Google. Please login first.")
            return None
        
        try:
            # Navigate to NotebookLM
            await self.page.goto("https://notebooklm.google.com")
            await self.page.wait_for_timeout(3000)
            
            # Click "New Notebook" or similar
            create_btn = await self.page.query_selector('button:has-text("New"), button:has-text("Create")')
            if create_btn:
                await create_btn.click()
                await self.page.wait_for_timeout(2000)
            
            # Upload files
            for file_path in files:
                if Path(file_path).exists():
                    # Look for file input or upload button
                    file_input = await self.page.query_selector('input[type="file"]')
                    if file_input:
                        await file_input.set_input_files(file_path)
                        await self.page.wait_for_timeout(2000)
                        logger.info(f"Uploaded: {file_path}")
            
            # Wait for processing
            await self.page.wait_for_timeout(5000)
            
            # Get notebook URL
            notebook_url = self.page.url
            logger.info(f"NotebookLM ready: {notebook_url}")
            
            return notebook_url
            
        except Exception as e:
            logger.error(f"NotebookLM upload failed: {e}")
            return None
    
    async def scrape_multiple(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Scrape multiple URLs."""
        results = []
        for url in urls:
            result = await self.scrape_page(url)
            results.append(result)
            await asyncio.sleep(1)  # Rate limiting
        return results


# Singleton instance
_scraper_instance: Optional[BrowserScraper] = None

def get_browser_scraper() -> BrowserScraper:
    """Get singleton browser scraper instance."""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = BrowserScraper()
    return _scraper_instance

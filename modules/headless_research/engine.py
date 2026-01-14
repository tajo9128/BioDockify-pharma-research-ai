"""
Headless Research Engine
Main orchestrator for stealth browsing, content extraction, and SurfSense sync.
Constraints: No Docker, strictly Playwright Python.
"""
import os
import asyncio
import logging
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Page, Browser

from .stealth import StealthContext
from .behavior import HumanBehavior
from .scraper import Scraper
from modules.surfsense import get_surfsense_client

logger = logging.getLogger("headless_research.engine")

class HeadlessResearcher:
    """
    Main class for autonomous deep research.
    Manages browser lifecycle, applies stealth, handles extraction, and syncs to SurfSense.
    """
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.stealth = StealthContext()
        self.behavior = HumanBehavior()
        self.scraper = Scraper()
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None

    async def __aenter__(self):
        self.playwright = await async_playwright().start()
        
        # Launch options for stability and stealth
        args = self.stealth.get_stealth_args()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=args
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def research(self, url: str) -> Dict[str, Any]:
        """
        Deep research a URL:
        1. Navigate stealthily
        2. Simulate human reading
        3. Extract content
        4. Sync to Knowledge Base / SurfSense
        """
        if not self.browser:
            raise RuntimeError("Browser not started. Use 'async with' context manager.")
        
        logger.info(f"Starting deep research on: {url}")
        
        # Create context with randomized user agent
        user_agent = self.stealth.get_random_user_agent()
        context = await self.browser.new_context(
            user_agent=user_agent,
            viewport={'width': 1280, 'height': 800} # Standard desktop
        )
        
        page = await context.new_page()
        self.page = page
        
        # Inject Stealth Scripts
        await self.stealth.apply_stealth(page)
        
        try:
            # 1. Navigate
            response = await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            if not response or response.status >= 400:
                logger.warning(f"Navigation failed with status {response.status if response else 'Unknown'}")
                return {"status": "failed", "error": "Navigation failed"}
            
            # 2. Simulate Human Behavior (Wait for dynamic content)
            await self.behavior.simulate_reading(page)
            
            # 3. Extract Content
            html = await page.content()
            markdown_content = await self.scraper.extract_markdown(html)
            metadata = await self.scraper.get_metadata(page)
            
            result = {
                "status": "success",
                "url": url,
                "title": metadata.get("title", "Untitled"),
                "content": markdown_content,
                "length": len(markdown_content)
            }
            
            # 4. Sync to SurfSense (and internal KB)
            await self._sync_to_surfsense(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Research failed for {url}: {e}")
            screenshot_path = f"error_{url.replace('://', '_').replace('/', '_')}.png"
            try:
                await page.screenshot(path=screenshot_path)
                logger.info(f"Saved error screenshot: {screenshot_path}")
            except:
                pass
            return {"status": "error", "error": str(e)}
        finally:
            await context.close()

    async def _sync_to_surfsense(self, result: Dict[str, Any]):
        """Upload research result to SurfSense as a document."""
        if result.get("status") != "success":
            return
            
        try:
            content = result.get("content", "").encode("utf-8")
            filename = f"research_{result['title'][:50].strip().replace(' ', '_')}.md"
            
            # Use the SurfSense client we built earlier
            client = get_surfsense_client()
            upload_result = await client.upload_document(content, filename)
            
            logger.info(f" synced to SurfSense: {upload_result}")
            
            # Also sync to internal vector store (fallback/dual-write)
            from modules.library.store import library_store
            from modules.rag.ingestor import ingestor
            from modules.rag.vector_store import get_vector_store
            
            # internal store
            file_record = library_store.add_file(content, filename)
            
            # internal ingest
            # We treat it as a temporary file for ingestion
            temp_path = library_store.get_file_path(file_record['id'])
            chunks = ingestor.ingest_file(str(temp_path))
            if chunks:
                get_vector_store().add_documents(chunks)
                logger.info(f"Synced to internal KB: {len(chunks)} chunks")
                
        except Exception as e:
            logger.error(f"Sync failed: {e}")

# Convenience function for simple usage
async def deep_research(url: str) -> Dict[str, Any]:
    async with HeadlessResearcher() as researcher:
        return await researcher.research(url)

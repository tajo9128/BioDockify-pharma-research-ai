import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from agent_zero.web_research.surfsense import SurfSense, CrawlConfig, ExtractionRules, CrawlResult

# Mock Executor to avoid network calls
class MockExecutor:
    def __init__(self):
        self.config = type('obj', (object,), {'timeout': 10})
    
    async def fetch_raw(self, url: str, timeout: int) -> Optional[Tuple[bytes, str]]:
        if "timeout" in url:
            await asyncio.sleep(2) # Simulate slow robots.txt
        if url.endswith("robots.txt"):
            return b"User-agent: *\nDisallow: /private", "text/plain"
        return b"<html><body><h1>Test Page</h1><p>Content</p><a href='/next'>Next</a><script>alert(1)</script></body></html>", "text/html"
    
    async def extract_text(self, html: str, url: str) -> str:
        # Simple extraction for mock
        return html

async def test_surfsense():
    logging.basicConfig(level=logging.INFO)
    surfsense = SurfSense()
    executor = MockExecutor()
    
    # 1. Test Seed URL Validation & Canonicalization
    config = CrawlConfig(
        urls=["https://example.com/", "invalid-url", "https://example.com/#frag"],
        rules=surfsense.create_default_rules(),
        depth=1,
        max_pages=2
    )
    
    print("--- Testing Seed URL Validation & Canonicalization ---")
    results = await surfsense.crawl(config, executor)
    # Should only crawl https://example.com
    # invalid-url should be skipped
    # https://example.com/#frag should be canonicalized to https://example.com and skipped as duplicate
    print(f"Results count: {len(results)}")
    for res in results:
        print(f"Crawled: {res.url}")

    # 2. Test Queue Deduplication (Discovered Links)
    print("\n--- Testing Queue Deduplication ---")
    surfsense = SurfSense() # Reset
    config = CrawlConfig(
        urls=["https://example.com"],
        rules=surfsense.create_default_rules(),
        depth=2,
        max_pages=5
    )
    # Mocking self._extract_links results would be better but let's see if duplicates appear
    results = await surfsense.crawl(config, executor)
    print(f"Results count: {len(results)}")
    for res in results:
         print(f"Crawled: {res.url}")

    # 3. Test robots.txt Caching & Timeout
    print("\n--- Testing robots.txt Caching ---")
    surfsense = SurfSense()
    # First call to example.com should fetch robots.txt
    # Second call should use cache
    await surfsense._respect_robots_txt("https://example.com/page1")
    start_time = asyncio.get_event_loop().time()
    await surfsense._respect_robots_txt("https://example.com/page2")
    end_time = asyncio.get_event_loop().time()
    print(f"Cache check time: {end_time - start_time:.4f}s")
    print(f"Robots cache domains: {list(surfsense.robots_cache.keys())}")

    # 4. Test Extraction Rule Sequencing (HTML vs Text)
    print("\n--- Testing Extraction Rule Sequencing ---")
    rules = surfsense.create_default_rules()
    rules.clean_patterns = [r'<script.*?</script>']
    html_with_script = "<html><body><script>secret</script>Text</body></html>"
    # If rules are applied to HTML, <script> secret </script> should be gone
    processed_html = await surfsense.apply_extraction_rules(html_with_script, rules)
    print(f"Processed HTML: {processed_html}")
    if "secret" not in processed_html:
        print("Success: Script removed from HTML before text extraction")

if __name__ == "__main__":
    asyncio.run(test_surfsense())

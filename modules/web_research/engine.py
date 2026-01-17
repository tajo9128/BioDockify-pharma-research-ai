"""
MiroThinker-Inspired Web Research Engine
Integrates Serper (Google Search) and Jina (Content Scraping) for deep internet research.
"""

import requests
import json
import logging
from typing import List, Dict, Optional

logger = logging.getLogger("web_research")

class WebResearchEngine:
    """
    Engine for deep web research capabilities.
    """
    
    def __init__(self, config):
        """
        Initialize with configuration dictionary or object.
        """
        # Handle both dict and object config access
        if isinstance(config, dict):
            ai_config = config.get("ai_provider", {})
        else:
            ai_config = getattr(config, "ai_provider", {})
            if not isinstance(ai_config, dict):
                # If using Pydantic model
                try:
                    ai_config = config.ai_provider
                except:
                    ai_config = {}

        self.serper_key = ai_config.get("serper_key", "")
        self.jina_key = ai_config.get("jina_key", "")
        
        if not self.serper_key:
            logger.warning("Serper API key not found. Web search will be limited.")

    async def search_google(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search Google using Serper API (MiroThinker standard) or Fallback.
        """
        if self.serper_key:
            return await self._search_serper(query, limit)
        else:
            logger.info("No Serper key found. Using Free Tier (DuckDuckGo Lite).")
            # Enforce "Limited API Use" for free tier
            free_limit = min(limit, 3) 
            return await self._search_ddg_lite(query, free_limit)

    async def _search_serper(self, query: str, limit: int) -> List[Dict]:
        """Paid API: Serper (Google Results)"""
        url = "https://google.serper.dev/search"
        payload = json.dumps({
            "q": query, 
            "num": limit,
            "autocorrect": True
        })
        headers = {
            'X-API-KEY': self.serper_key,
            'Content-Type': 'application/json'
        }

        import httpx
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, headers=headers, content=payload)
                response.raise_for_status()
                data = response.json()
            
            organic = data.get("organic", [])
            results = []
            
            for res in organic:
                results.append({
                    "title": res.get("title", ""),
                    "link": res.get("link", ""),
                    "snippet": res.get("snippet", ""),
                    "source": "Google (Serper)"
                })
                
            return results
        except Exception as e:
            logger.error(f"Serper search failed: {e}")
            return []

    async def _search_ddg_lite(self, query: str, limit: int) -> List[Dict]:
        """Free Tier: DuckDuckGo HTML Scrape (Limited Capability)"""
        import httpx
        try:
            # Quick HTML scrape of DDG Lite (no JS required)
            url = "https://html.duckduckgo.com/html/"
            data = {'q': query}
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, data=data, headers=headers)
                resp.raise_for_status()
                text = resp.text
            
            # Simple regex parsing to avoid heavy BS4 dependency if missing
            import re
            
            results = []
            # Find result blocks
            links = re.findall(r'<a class="result__a" href="([^"]+)">([^<]+)</a>', text)
            snippets = re.findall(r'<a class="result__snippet" href="[^"]+">([^<]+)</a>', text)
            
            for i, (href, title) in enumerate(links):
                if i >= limit: break
                snippet = snippets[i] if i < len(snippets) else "No snippet available."
                
                results.append({
                    "title": title,
                    "link": href,
                    "snippet": snippet,
                    "source": "DuckDuckGo (Free)"
                })
                
            return results
            
        except Exception as e:
            logger.error(f"DDG Lite search failed: {e}")
            return [{
                "title": "Search Unavailable",
                "link": "",
                "snippet": "Both Serper and Free Fallback failed. Please check internet connection.",
                "source": "System"
            }]

    async def deep_read(self, url: str) -> str:
        """
        Smart Deep Read:
        1. Try Fast Mode (Jina/MiroThinker)
        2. If blocked/failed -> Try Strong Mode (HeadlessX Stealth)
        """
        # 1. FAST MODE: JINA
        try:
            import httpx
            jina_url = f"https://r.jina.ai/{url}"
            headers = {'X-Return-Format': 'markdown'}
            if self.jina_key:
                headers['Authorization'] = f"Bearer {self.jina_key}"
            
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(jina_url, headers=headers)
            
            if response.status_code == 200:
                content = response.text
                if len(content) > 500: # Valid content check
                    return content
                else:
                    logger.warning(f"Jina content too short ({len(content)} chars). Trying Headless fallback.")
            else:
                logger.warning(f"Jina failed ({response.status_code}). Trying Headless fallback.")
                
        except Exception as e:
            logger.warning(f"Fast read failed: {e}. Switching to Strong Mode.")

        # 2. STRONG MODE: HEADLESSX (Stealth Browser)
        try:
            logger.info(f"🚀 Deploying HeadlessX Stealth for: {url}")
            from modules.headless_research import HeadlessResearcher
            
            async with HeadlessResearcher() as researcher:
                result = await researcher.research(url)
                
            if result.get("status") == "success":
                return f"[Source: HeadlessX Stealth]\n\n{result.get('content', '')}"
            else:
                return f"Error reading content: {result.get('error', 'Unknown error')}"
                
        except ImportError:
            return "HeadlessX module not found. Install playwright to enable Strong Mode."
        except Exception as e:
            logger.error(f"HeadlessX failed: {e}")
            return f"Failed to read content (All methods exhausted): {e}"

    async def research_topic(self, topic: str, depth: int = 3) -> str:
        """
        Performs a deep research workflow (Async).
        """
        # Logic: If Paid (Serper Key), allow requested depth.
        # If Free (No Key), cap depth at 3.
        
        effective_depth = depth
        if not self.serper_key:
            logger.info("Free Tier: Limiting research depth to 3.")
            effective_depth = min(depth, 3)
        else:
            logger.info(f"Paid Tier: Full research depth {depth}.")
        
        results = await self.search_google(topic, limit=effective_depth)
        
        combined_report = [f"# Research Report: {topic}\n"]
        combined_report.append(f"**Mode:** {'Unlimited (Paid)' if self.serper_key else 'Limited (Free)'}")
        combined_report.append(f"**Sources Found:** {len(results)}\n")
        
        for i, res in enumerate(results):
            if not res['link']: continue
            
            print(f"[*] Reading source {i+1}: {res['title']}")
            combined_report.append(f"## Source {i+1}: {res['title']}")
            combined_report.append(f"**URL:** {res['link']}")
            combined_report.append(f"**Source:** {res.get('source', 'Web')}\n")
            
            content = await self.deep_read(res['link'])
            
            # Truncate if too massive
            max_len = 15000 
            if len(content) > max_len:
                content = content[:max_len] + "\n...[Truncated]..."
                
            combined_report.append(content)
            combined_report.append("\n---\n")
            
        return "\n".join(combined_report)

    def _fallback_search(self, query: str) -> List[Dict]:
        """Deprecated: Logic moved to search_google"""
        return []

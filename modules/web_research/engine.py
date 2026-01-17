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

    def search_google(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Search Google using Serper API (MiroThinker standard) or Fallback.
        """
        if self.serper_key:
            return self._search_serper(query, limit)
        else:
            logger.info("No Serper key found. Using Free Tier (DuckDuckGo Lite).")
            # Enforce "Limited API Use" for free tier
            free_limit = min(limit, 3) 
            return self._search_ddg_lite(query, free_limit)

    def _search_serper(self, query: str, limit: int) -> List[Dict]:
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

        try:
            response = requests.post(url, headers=headers, data=payload, timeout=10)
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

    def _search_ddg_lite(self, query: str, limit: int) -> List[Dict]:
        """Free Tier: DuckDuckGo HTML Scrape (Limited Capability)"""
        try:
            # Quick HTML scrape of DDG Lite (no JS required)
            url = "https://html.duckduckgo.com/html/"
            payload = {'q': query}
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            resp = requests.post(url, data=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            
            # Simple regex parsing to avoid heavy BS4 dependency if missing
            import re
            
            results = []
            # Find result blocks
            links = re.findall(r'<a class="result__a" href="([^"]+)">([^<]+)</a>', resp.text)
            snippets = re.findall(r'<a class="result__snippet" href="[^"]+">([^<]+)</a>', resp.text)
            
            for i, (href, title) in enumerate(links):
                if i >= limit: break
                snippet = snippets[i] if i < len(snippets) else "No snippet available."
                
                # Clean URL (DDG wraps specific URLs sometimes, but usually direct in HTML mode)
                # Decode URL if needed
                
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
                "snippet": "Both Serper and Free Fallback failed. Please check internet connection or configure Serper Key.",
                "source": "System"
            }]

    def deep_read(self, url: str) -> str:
        """
        Convert any URL to Clean Markdown using Jina Reader.
        """
        # Jina works without key (lower limits) or with key (higher limits)
        jina_url = f"https://r.jina.ai/{url}"
        
        headers = {
            'X-Return-Format': 'markdown'
        }
        if self.jina_key:
            headers['Authorization'] = f"Bearer {self.jina_key}"
        
        try:
            response = requests.get(jina_url, headers=headers, timeout=20)
            
            if response.status_code == 200:
                return response.text
            else:
                return f"Error reading content ({response.status_code}): {response.text[:200]}"
                
        except Exception as e:
            logger.error(f"Jina read failed: {e}")
            return f"Failed to read content: {e}"

    def research_topic(self, topic: str, depth: int = 3) -> str:
        """
        Performs a deep research workflow.
        Automatically scales based on Pay/Free tier availability.
        """
        # Logic: If Paid (Serper Key), allow requested depth.
        # If Free (No Key), cap depth at 3 (Limited API Use).
        
        effective_depth = depth
        if not self.serper_key:
            logger.info("Free Tier: Limiting research depth to 3.")
            effective_depth = min(depth, 3)
        else:
            logger.info(f"Paid Tier: Full research depth {depth}.")
        
        results = self.search_google(topic, limit=effective_depth)
        
        combined_report = [f"# Research Report: {topic}\n"]
        combined_report.append(f"**Mode:** {'Unlimited (Paid)' if self.serper_key else 'Limited (Free)'}")
        combined_report.append(f"**Sources Found:** {len(results)}\n")
        
        for i, res in enumerate(results):
            if not res['link']: continue
            
            print(f"[*] Reading source {i+1}: {res['title']}")
            combined_report.append(f"## Source {i+1}: {res['title']}")
            combined_report.append(f"**URL:** {res['link']}")
            combined_report.append(f"**Source:** {res.get('source', 'Web')}\n")
            
            content = self.deep_read(res['link'])
            
            # Truncate if too massive
            max_len = 10000 
            if len(content) > max_len:
                content = content[:max_len] + "\n...[Truncated]..."
                
            combined_report.append(content)
            combined_report.append("\n---\n")
            
        return "\n".join(combined_report)

    def _fallback_search(self, query: str) -> List[Dict]:
        """Deprecated: Logic moved to search_google"""
        return []

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
        Search Google using Serper API (MiroThinker standard).
        Returns list of {"title", "link", "snippet"}.
        """
        if not self.serper_key:
            logger.warning("Attempted search without Serper Key.")
            return self._fallback_search(query)

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
                    "date": res.get("date", "")
                })
                
            return results
            
        except Exception as e:
            logger.error(f"Serper search failed: {e}")
            return [{"title": "Search Error", "link": "", "snippet": str(e)}]

    def deep_read(self, url: str) -> str:
        """
        Convert any URL to Clean Markdown using Jina Reader (MiroThinker standard).
        """
        # Jina works without key (lower limits) or with key (higher limits)
        jina_url = f"https://r.jina.ai/{url}"
        
        headers = {
            'X-Return-Format': 'markdown'
        }
        if self.jina_key:
            headers['Authorization'] = f"Bearer {self.jina_key}"
        
        try:
            # Add some standard headers to avoid basic bot blocking before hitting Jina
            # Actually Jina handles the fetching, so we just call Jina.
            
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
        Performs a quick research workflow:
        1. Search Google
        2. Pick top 'depth' results
        3. Scrape/Read them
        4. Return combined context
        """
        results = self.search_google(topic, limit=depth)
        
        combined_report = [f"# Research Report: {topic}\n"]
        
        for i, res in enumerate(results):
            if not res['link']: continue
            
            print(f"[*] Reading source {i+1}: {res['title']}")
            combined_report.append(f"## Source {i+1}: {res['title']}")
            combined_report.append(f"**URL:** {res['link']}\n")
            
            content = self.deep_read(res['link'])
            
            # Truncate if too massive (prevent context window overflow basics)
            if len(content) > 10000:
                content = content[:10000] + "\n...[Truncated]..."
                
            combined_report.append(content)
            combined_report.append("\n---\n")
            
        return "\n".join(combined_report)

    def _fallback_search(self, query: str) -> List[Dict]:
        """Fallback when no keys configured."""
        # For now, return a prompt to configure keys
        return [{
            "title": "Setup Required",
            "link": "",
            "snippet": "To enable Live Internet Research, please add your 'serper_key' to the configuration. Get one at serper.dev."
        }]

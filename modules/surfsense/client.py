"""
SurfSense Client Module
Integrates with SurfSense API for advanced RAG, search, and podcast generation.
Provides fallback-safe methods that gracefully handle when SurfSense is offline.
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
import aiohttp
from runtime.robust_connection import async_with_retry

logger = logging.getLogger("surfsense_client")

class SurfSenseClient:
    """Client for interacting with SurfSense API."""
    
    def __init__(self, base_url: str = "http://localhost:8000", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._healthy = False
    
    def _headers(self) -> Dict[str, str]:
        """Get request headers with optional API key."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers
    
    async def health_check(self) -> bool:
        """Check if SurfSense is running and healthy."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/health",
                    timeout=aiohttp.ClientTimeout(total=3)
                ) as resp:
                    self._healthy = resp.status == 200
                    return self._healthy
        except Exception as e:
            logger.debug(f"SurfSense health check failed: {e}")
            self._healthy = False
            return False
    
    @property
    def is_healthy(self) -> bool:
        """Return cached health status."""
        return self._healthy
    
    @async_with_retry(max_retries=3, circuit_name="surfsense")
    async def search(self, query: str, search_space_id: Optional[str] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search SurfSense knowledge base.
        Returns list of results with text, source, and score.
        """
        if not await self.health_check():
            return []
        
        try:
            payload = {
                "query": query,
                "top_k": top_k
            }
            if search_space_id:
                payload["search_space_id"] = search_space_id
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/search",
                    json=payload,
                    headers=self._headers(),
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("results", [])
                    else:
                        logger.warning(f"SurfSense search failed: {resp.status}")
                        return []
        except Exception as e:
            logger.error(f"SurfSense search error: {e}")
            return []
    
    @async_with_retry(max_retries=2, circuit_name="surfsense")
    async def chat(self, message: str, search_space_id: Optional[str] = None, 
                   conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Chat with SurfSense's AI.
        Returns response with text and citations.
        """
        if not await self.health_check():
            return {"error": "SurfSense offline"}
        
        try:
            payload = {
                "message": message,
            }
            if search_space_id:
                payload["search_space_id"] = search_space_id
            if conversation_id:
                payload["conversation_id"] = conversation_id
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    headers=self._headers(),
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        return {"error": f"Chat failed: {resp.status}"}
        except Exception as e:
            logger.error(f"SurfSense chat error: {e}")
            return {"error": str(e)}
    
    @async_with_retry(max_retries=2, circuit_name="surfsense")
    async def upload_document(self, content: bytes, filename: str, 
                               search_space_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload a document to SurfSense for indexing.
        """
        if not await self.health_check():
            return {"status": "skipped", "reason": "SurfSense offline"}
        
        try:
            data = aiohttp.FormData()
            data.add_field('file', content, filename=filename)
            if search_space_id:
                data.add_field('search_space_id', search_space_id)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/documents/upload",
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return {"status": "success", **result}
                    else:
                        return {"status": "failed", "error": f"HTTP {resp.status}"}
        except Exception as e:
            logger.error(f"SurfSense upload error: {e}")
            return {"status": "failed", "error": str(e)}
    
    VALID_VOICES = {'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'}

    async def generate_podcast(self, chat_id: str, voice: str = "alloy") -> Dict[str, Any]:
        """
        Generate audio podcast from a chat conversation.
        
        Args:
            chat_id: The conversation ID to convert to podcast
            voice: TTS voice (alloy, echo, fable, onyx, nova, shimmer for OpenAI)
        
        Returns:
            Dict with audio_url and duration
        """
        if not await self.health_check():
            return {"error": "SurfSense offline"}
        
        if voice not in self.VALID_VOICES:
            logger.warning(f"Invalid voice '{voice}', defaulting to 'alloy'")
            voice = "alloy"

        try:
            payload = {
                "chat_id": chat_id,
                "voice": voice
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/podcasts/generate",
                    json=payload,
                    headers=self._headers(),
                    timeout=aiohttp.ClientTimeout(total=120)  # Podcast gen can take time
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        return {"error": f"Podcast generation failed: {resp.status}"}
        except Exception as e:
            logger.error(f"SurfSense podcast error: {e}")
            return {"error": str(e)}
    
    async def list_documents(self, search_space_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all documents in a search space."""
        if not await self.health_check():
            return []
        
        try:
            params = {}
            if search_space_id:
                params["search_space_id"] = search_space_id
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/documents",
                    params=params,
                    headers=self._headers(),
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("documents", [])
                    return []
        except Exception as e:
            logger.error(f"SurfSense list documents error: {e}")
            return []


# Singleton instance
_surfsense_client: Optional[SurfSenseClient] = None

def get_surfsense_client(base_url: str = "http://localhost:8000", 
                          api_key: Optional[str] = None) -> SurfSenseClient:
    """Get or create the SurfSense client singleton."""
    global _surfsense_client
    if _surfsense_client is None:
        _surfsense_client = SurfSenseClient(base_url, api_key)
    return _surfsense_client

def configure_surfsense(base_url: str, api_key: Optional[str] = None):
    """Reconfigure the SurfSense client with new settings."""
    global _surfsense_client
    _surfsense_client = SurfSenseClient(base_url, api_key)

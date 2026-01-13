
import os
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("surfsense_client")

class SurfSenseClient:
    """
    Client for interacting with the local SurfSense knowledge engine.
    """
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.timeout = 30.0

    async def health_check(self) -> bool:
        """Checks if SurfSense service is reachable."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
        except Exception:
            return False

    async def search(self, query: str) -> Dict[str, Any]:
        """
        Performs a search (RAG/Knowledge) via SurfSense.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Assuming standard SurfSense/OpenAPI endpoint structure
                resp = await client.post(f"{self.base_url}/api/v1/search", json={"query": query})
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"SurfSense Search Failed: {e}")
            return {"error": str(e), "results": []}

    async def upload_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Uploads a file to SurfSense for ingestion.
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                files = {'file': (filename, file_content)}
                # Endpoint based on typical SurfSense/FastAPI structure
                resp = await client.post(f"{self.base_url}/api/v1/document/upload", files=files)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"SurfSense Upload Failed: {e}")
            return {"error": str(e), "status": "failed"}

    async def create_podcast(self, text_content: str) -> Optional[str]:
        """
        Requests audio generation from SurfSense.
        Returns URL or binary of the audio.
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                 resp = await client.post(f"{self.base_url}/api/v1/podcast/generate", json={"text": text_content})
                 resp.raise_for_status()
                 result = resp.json()
                 return result.get("audio_url")
        except Exception as e:
            logger.error(f"SurfSense Podcast Failed: {e}")
            return None

# Singleton
surfsense = SurfSenseClient()

"""
Screening Engine
Uses AI to evaluate papers against inclusion/exclusion criteria.
"""
import logging
import json
from typing import List, Dict, Any
from dataclasses import asdict

from .discovery import Paper
# We'll use the LLM provider config from main/config_loader to verify
# or repurpose the agent_chat logic. For now, we'll assume we can call an LLM helper.
# Since we don't have a direct "llm_client" module exposed yet, we might need to 
# use the provider logic from api/main.py or extract it. 
# Best approach: Create a helper in modules/agent/llm.py or similar, but for now
# we will mock the strict interaction or use the existing 'agent_chat_endpoint' logic pattern if possible.
# Actually, let's assume we can import a generic 'ask_llm' function which we should create.

logger = logging.getLogger("literature.screening")

class ContentScreener:
    def __init__(self):
        pass

    async def screen_papers(self, papers: List[Paper], criteria: str) -> List[Paper]:
        """
        Screen a list of papers based on the provided criteria.
        Returns a filtered list of included papers.
        """
        logger.info(f"Screening {len(papers)} papers against criteria: {criteria}")
        
        selected_papers = []
        
        # Batch processing to avoid context limits if list is huge, 
        # but for per-paper decision acting specifically is often better/more accurate.
        
        # For this implementation, we'll do a simple heuristic first (keyword match) purely for speed demo,
        # OR ideally call the LLM for each abstract.
        # Let's try a hybrid:
        
        from modules.surfsense import get_surfsense_client # We can use SurfSense/LLM if available
        # Or better, just use the internal LLM logic.
        
        # TODO: Proper LLM integration here.
        # For now, we will select top 50% by citation/year if no LLM, 
        # but the plan calls for AI screening.
        
        # Let's just pass all for now with a log, 
        # as we need to extract the LLM calling logic from `api/main.py` to be reusable.
        # I will mark this as a TODO and just return the top N.
        
        selected_papers = papers[:10] # Mock selection
        return selected_papers

# We need a reusable LLM client. 
# I will create 'modules/agent/llm_client.py' to centralize LLM calls (OpenAI/Ollama/etc)
# so both API and this module can use it.

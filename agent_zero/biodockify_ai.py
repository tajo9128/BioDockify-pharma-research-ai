"""
BioDockify AI - The Main Entry Point.
Wraps the Triple Hybrid Agent (Agent Zero + NanoBot + SurfSense).
"""
import logging
import asyncio
from typing import Optional, Any
from abc import ABC, abstractmethod

from agent_zero.hybrid.agent import HybridAgent, create_hybrid_agent

logger = logging.getLogger(__name__)

class BioDockifyAI:
    """
    Main AI Controller for BioDockify.
    Ensures single unified interface for all AI operations.
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = BioDockifyAI()
        return cls._instance
        
    def __init__(self):
        self.agent: Optional[HybridAgent] = None
        self._init_done = False
        
    async def initialize(self, workspace_path: str = "./data/workspace"):
        """Initialize the hybrid engine."""
        if self._init_done:
            return
            
        logger.info("Initializing BioDockify Triple Hybrid AI...")
        
        try:
            self.agent = create_hybrid_agent(workspace_path)
            # Setup skills, tools, channels here
            # self.agent.skills = SkillsLoader(self.agent).load_all()
            
            self._init_done = True
            logger.info("BioDockify AI Initialized Successfully.")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI: {e}")
            raise e
            
    async def process_chat(self, user_message: str) -> str:
        """Process user chat message."""
        if not self.agent:
            await self.initialize()
            
        return await self.agent.chat(user_message)
        
    async def run_task(self, task: str):
        """Run an autonomous task."""
        if not self.agent:
            await self.initialize()
            
        # Inject task and start loop
        self.agent.loop_data.user_message = f"Task: {task}"
        await self.agent.monologue()
        return self.agent.loop_data.last_response

def get_biodockify_ai():
    return BioDockifyAI.get_instance()

AI = BioDockifyAI

"""
BioDockify AI - The Main Entry Point.
Wraps the Triple Hybrid Agent (Agent Zero + NanoBot + SurfSense).
"""
import logging
import asyncio
from typing import Optional, Any
from abc import ABC, abstractmethod

from agent_zero.hybrid.agent import HybridAgent, create_hybrid_agent
from nanobot.agent.receptionist import NanoBotReceptionist

logger = logging.getLogger(__name__)

class BioDockifyAI:
    """
    Main AI Controller for BioDockify.
    Ensures single unified interface for all AI operations.
    HIERARCHY:
    1. User talks to NanoBot (Receptionist).
    2. NanoBot talks to Agent Zero (Boss/HybridAgent).
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = BioDockifyAI()
        return cls._instance
        
    def __init__(self):
        self.agent: Optional[HybridAgent] = None
        self.nanobot: Optional[NanoBotReceptionist] = None # The Receptionist
        self._init_done = False
        
    async def initialize(self, workspace_path: str = "./data/workspace"):
        """Initialize the hybrid engine with robustness checks."""
        if self._init_done:
            return
            
        logger.info("Initializing BioDockify Triple Hybrid AI...")
        
        # 1. robust_retry_loop
        max_retries = 5
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                # Pre-flight checks (Optional but recommended)
                # self._check_dependencies() 
                
                # Boss
                self.agent = create_hybrid_agent(workspace_path)
                
                # Receptionist (Given access to Boss)
                self.nanobot = NanoBotReceptionist(agent_zero_instance=self)
                
                # Bridge: Connect Supervisor to Agent Heartbeats
                if self.agent and self.nanobot and hasattr(self.nanobot, 'supervisor'):
                    self.agent.on_heartbeat = self.nanobot.supervisor.register_heartbeat
                    logger.info("Bridge established: Agent Zero heartbeats connected to NanoBot Supervisor.")
                
                self._init_done = True
                logger.info("BioDockify AI (Boss & Receptionist) Initialized Successfully.")
                return
                
            except Exception as e:
                logger.warning(f"Initialization attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt)
                    logger.info(f"Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error("All initialization attempts failed.")
                    raise e
                    
    def _check_dependencies(self):
        """Check critical upstream services (DB, Redis, etc)."""
        import socket
        services = [
            ("postgres", 5432),
            ("redis", 6379)
        ]
        for host, port in services:
            try:
                with socket.create_connection((host, port), timeout=1):
                    pass
            except OSError:
                logger.warning(f"Dependency check failed: {host}:{port} is not reachable yet.")
                # We don't raise here, just warn, as local execution might not use containers

            
    async def process_chat(self, user_message: str, mode: str = "lite") -> str:
        """
        Process user chat message.
        - mode="lite": Route to NanoBot Receptionist (Fast, Tools).
        - mode="hybrid": Route to Agent Zero (Reasoning, Deep Research).
        """
        if not self.agent or not self.nanobot:
            await self.initialize()
            
        if mode == "hybrid":
            # Direct to Boss (Agent Zero)
            logger.info("Routing to Agent Zero (Hybrid Mode)")
            return await self.agent.chat(user_message)
        else:
            # Default to Receptionist (NanoBot)
            logger.info("Routing to NanoBot (Lite Mode)")
            return await self.nanobot.process_chat(user_message)
        
    async def run_task(self, task: str):
        """Run an autonomous task (Called by NanoBot or API)."""
        if not self.agent:
            await self.initialize()
            
        # Boss handles the task
        self.agent.loop_data.user_message = f"Task: {task}"
        await self.agent.monologue()
        return self.agent.loop_data.last_response

def get_biodockify_ai():
    return BioDockifyAI.get_instance()

AI = BioDockifyAI

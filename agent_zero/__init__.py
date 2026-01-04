"""
Agent Zero - Autonomous Research Orchestrator for BioDockify v2.0.0

This package provides an autonomous AI system that:
- Receives high-level PhD research goals
- Decomposes goals into executable tasks
- Selects appropriate tools automatically
- Self-corrects on failures
- Maintains persistent memory across sessions

Main Components:
- AgentZero: Main orchestrator for autonomous execution
- PhDPlanner: Stage detection and tool recommendation
- PersistentMemory: Long-term memory storage and retrieval

Example Usage:
    from agent_zero import AgentZero, PhDPlanner, PersistentMemory, ToolRegistry

    # Initialize
    llm = YourLLMProvider()
    memory = PersistentMemory('./data/agent_memory')
    planner = PhDPlanner(llm)
    tool_registry = ToolRegistry()

    # Create agent
    agent = AgentZero(llm, tool_registry, memory)

    # Execute goal
    result = await agent.execute_goal(
        goal="Conduct literature review",
        phd_stage="early"
    )
"""

__version__ = '2.0.0'
__author__ = 'BioDockify Team'

from .core import AgentZero, PhDPlanner, PersistentMemory
from .core.orchestrator import ToolRegistry, Tool, LLMProvider

__all__ = [
    'AgentZero',
    'PhDPlanner',
    'PersistentMemory',
    'ToolRegistry',
    'Tool',
    'LLMProvider',
]

"""
Hybrid Agent Core - The Brain of BioDockify AI
Combines:
1. Agent Zero's monologue loop (continuous reasoning)
2. NanoBot's tools & skills
3. SurfSense's research capabilities
4. Unified LLM Interface (LM Studio/API)
"""

import asyncio
import json
import logging
from typing import Any, Callable, Coroutine, List, Optional

from modules.llm.factory import LLMFactory
from orchestration.planner.orchestrator import OrchestratorConfig
from agent_zero.hybrid.context import AgentContext, AgentConfig, LoopData
from agent_zero.hybrid.memory import HybridMemory, MemoryArea
from agent_zero.hybrid.prompts import get_system_prompt
from agent_zero.hybrid.diagnosis import SystemDiagnosis
from agent_zero.hybrid.tools.code_execution import SafeCodeExecutionTool
from agent_zero.skills.reviewer_agent import get_reviewer_agent
from agent_zero.hybrid.errors import RepairableException, InterventionException, format_error

logger = logging.getLogger(__name__)

class HybridAgent:
    """
    BioDockify Hybrid Agent (Agent Zero + NanoBot + SurfSense).
    Integrates:
    - Self-Awareness (Agent Zero Monologue)
    - Communications (NanoBot MessageBus)
    - Researcher (SurfSense)
    """
    
    def __init__(self, config: AgentConfig, llm_config: OrchestratorConfig):
        self.config = config
        self.context = AgentContext(config=config)
        self.memory = HybridMemory(config.workspace_path, config.memory_subdir)
        
        # Unified LLM Interface
        self.llm_adapter = LLMFactory.get_adapter(
            provider=llm_config.primary_model, 
            config=llm_config
        )
        if not self.llm_adapter:
            raise ValueError(f"Failed to initialize LLM adapter for provider: {llm_config.primary_model}")
            
        # Initialize Tools
        self.diagnosis = SystemDiagnosis()
        self.code_exec = SafeCodeExecutionTool()
        self.tools = {
            "diagnosis": self.diagnosis.get_diagnosis_report,
            "execute_shell": self.code_exec.execute_shell,
            "verify_citations": get_reviewer_agent().verify_citations
        }
        
        self.skills = {} # Will load skills later
        
        # State
        self.loop_data = LoopData()
        self.is_running = False
        


    async def monologue(self):
        """
        The Core Loop (Agent Zero Style).
        Continuous reasoning cycle until task completion or pause.
        Supports Self-Healing and User Intervention.
        """
        self.is_running = True
        logger.info(f"Agent {self.config.name} starting monologue loop...")
        
        while self.is_running:
            try:
                # 1. Prepare Context (History, Memory, Skills)
                prompt = await self._build_prompt()
                
                # 2. Call LLM (Reasoning)
                response = await self.llm_adapter.generate(prompt)
                
                # 3. Process Response (Tool Calls vs Answer)
                if self._is_tool_call(response):
                    try:
                        result = await self._execute_tool(response)
                        await self.memory.add_memory(f"Tool Result: {result}", area=MemoryArea.FRAGMENTS)
                        self.loop_data.history.append({"role": "system", "content": f"Tool Output: {result}"})
                    except Exception as e:
                        # Wrap tool errors as Repairable to trigger fix
                        raise RepairableException(f"Tool execution failed: {str(e)}")
                else:
                    # Final answer or conversation
                    self.loop_data.last_response = response
                    self.loop_data.history.append({"role": "assistant", "content": response})
                    
                    # Store important insights
                    if len(response) > 50:
                        await self.memory.add_memory(response, area=MemoryArea.MAIN)
                        
                    # Pause loop to wait for user if just chatting
                    if not self._has_pending_tasks():
                         self.is_running = False

            except RepairableException as e:
                logger.warning(f"Self-Healing Triggered: {e}")
                err_msg = format_error(e)
                # Feed error back into history to prompt a fix
                self.loop_data.history.append({
                    "role": "system", 
                    "content": f"CRITICAL ERROR: {err_msg}\nYou must fix this error in your next step."
                })
                # Loop continues immediately to let LLM try again
                
            except InterventionException:
                logger.info("User intervention received. Pausing.")
                self.is_running = False
                
            except Exception as e:
                logger.error(f"Fatal error in monologue: {e}")
                self.loop_data.history.append({"role": "system", "content": f"Fatal System Error: {str(e)}"})
                self.is_running = False
                raise e
                
    async def chat(self, user_message: str):
        """Entry point for user interaction."""
        self.loop_data.user_message = user_message
        self.loop_data.history.append({"role": "user", "content": user_message})
        
        # Start/Resume loop
        await self.monologue()
        
        return self.loop_data.last_response

    async def _build_prompt(self) -> str:
        """Construct the prompt from context, memory, and history."""
        history_text = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in self.loop_data.history[-10:]])
        
        system = f"{get_system_prompt()}\n"
        system += f"Workspace: {self.config.workspace_path}\n"
        system += f"Current Context:\n{await self.memory.get_recent(1)}\n"
        system += f"Tools Available: {list(self.tools.keys())}\n"
        
        return f"{system}\n\nConversation:\n{history_text}\n\n{self.config.name}:"

    def _is_tool_call(self, response: str) -> bool:
        """
        Check if response requests a tool execution.
        Looks for JSON format or explicit tool: markers.
        """
        response_lower = response.lower()
        if "{" in response and "tool" in response_lower:
            return True
        return any(marker in response_lower for marker in ["tool:", "call:", "execute:"])

    async def _execute_tool(self, response: str) -> str:
        """
        Execute a requested tool using robust parsing.
        Supports both legacy string-based and modern JSON-based tool calls.
        """
        tool_name = None
        params = {}

        # 1. Try JSON Parsing (Robust)
        try:
            import re
            json_match = re.search(r'(\{.*\})', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(1))
                tool_name = data.get("tool") or data.get("task") or data.get("call")
                params = data.get("params") or data.get("args") or {}
                # If tool_name is None, it might be structured like {"tool_name": {...params}}
                if not tool_name and len(data) == 1:
                    tool_name = list(data.keys())[0]
                    params = data[tool_name]
        except Exception:
            pass

        # 2. Fallback to String Parsing (Legacy)
        if not tool_name:
            for marker in ["tool:", "call:", "execute:"]:
                if marker in response.lower():
                    # Format: "tool: tool_name parameters..."
                    parts = response.split(marker, 1)[1].strip().split(None, 1)
                    tool_name = parts[0].strip(": \n")
                    if len(parts) > 1:
                        params = {"input": parts[1].strip()}
                    break

        if not tool_name:
            return "Error: Could not parse tool name from response."

        # 3. Execution Dispatch
        logger.info(f"HybridAgent: Executing tool '{tool_name}' with params: {params}")
        
        # Normalize tool name
        tool_name = tool_name.lower().replace("_", "")
        
        # Check registered tools
        for registered_name, func in self.tools.items():
            if registered_name.lower().replace("_", "") == tool_name:
                try:
                    if asyncio.iscoroutinefunction(func):
                        result = await func(params)
                    else:
                        result = func(params)
                    return str(result)
                except Exception as e:
                    logger.error(f"Tool execution failed ({tool_name}): {e}")
                    return f"Error executing {tool_name}: {str(e)}"

        return f"Error: Tool '{tool_name}' not found. Available: {list(self.tools.keys())}"

    def _has_pending_tasks(self) -> bool:
        return False

# Factory to create the unified agent
def create_hybrid_agent(workspace: str = "./data/workspace") -> HybridAgent:
    from orchestration.planner.orchestrator import OrchestratorConfig
    
    # Load config (would come from settings in real app)
    llm_config = OrchestratorConfig(
        primary_model="lm_studio", # Defaulting to LM Studio as requested
        custom_base_url="http://localhost:1234/v1",
        custom_model="auto"
    )
    
    agent_config = AgentConfig(
        name="Nova",
        workspace_path=workspace
    )
    
    return HybridAgent(agent_config, llm_config)

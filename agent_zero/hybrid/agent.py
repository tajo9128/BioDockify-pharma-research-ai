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
from agent_zero.hybrid.tools.file_editor import FileEditorTool
from agent_zero.hybrid.tools.config_tool import ConfigManagerTool
from agent_zero.hybrid.tools.graph_tool import KnowledgeGraphTool
from agent_zero.hybrid.tools.github_tool import GitHubTool
from agent_zero.skills.reviewer_agent import get_reviewer_agent
from agent_zero.skills.achademio.wrapper import get_achademio
from agent_zero.skills.latte_review.wrapper import get_latte_review
from agent_zero.skills.deep_drive.wrapper import get_deep_drive
from agent_zero.skills.scholar_copilot.wrapper import get_scholar_copilot
from agent_zero.skills.email_messenger import get_email_messenger
from agent_zero.skills.browser_scraper import get_browser_scraper
from modules.headless_research.engine import deep_research as stealth_deep_research
from agent_zero.hybrid.errors import RepairableException, InterventionException, format_error
from agent_zero.hybrid.bus import MessageBus, OutboundMessage, InboundMessage
from agent_zero.services.cron import CronService

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
            
        # --- NanoBot Core Integrations ---
        self.bus = MessageBus()
        self.cron = CronService(config.workspace_path, self._handle_external_trigger)
        
        # Initialize Tools
        self.diagnosis = SystemDiagnosis()
        self.code_exec = SafeCodeExecutionTool()
        self.file_editor = FileEditorTool(root_dir=".") # Full access to current execution dir
        self.config_manager = ConfigManagerTool()
        self.graph_tool = KnowledgeGraphTool()
        
        # GitHub Tool (Dynamic injection)
        github_token = getattr(llm_config, "github_token", None)
        self.github = GitHubTool(token=github_token)
        
        self.tools = {
            "diagnosis": self.diagnosis.get_diagnosis_report,
            "execute_shell": self.code_exec.execute_shell,
            "execute_python": self.code_exec.execute_python,
            "verify_citations": get_reviewer_agent().verify_citations,
            
            # File Editing (Self-Repair)
            "read_file": self.file_editor.read_file,
            "write_file": self.file_editor.write_file,
            "replace_in_file": self.file_editor.replace_in_file,
            
            # Agent Spawning
            "spawn_agent": self._spawn_subagent,
            
            # NanoBot: Messaging
            "send_message": self._tool_send_message,
            
            # NanoBot: Cron
            "manage_cron": self._tool_manage_cron,
            
            # NanoBot: GitHub
            "github_search": self.github.search_repositories,
            "github_read": self.github.get_repo_content,
            "github_issue": self.github.create_issue,
            
            # Config Management (Self-Correction)
            "get_config": self.config_manager.get_config,
            "update_config": self.config_manager.update_config,

            # SurfSense: Deep Research
            "deep_research": self._tool_deep_research,

            # Knowledge Graph (Memgraph/Neo4j)
            "graph_query": self.graph_tool.query_graph,
            "graph_schema": self.graph_tool.get_schema,
            "graph_add_node": self.graph_tool.add_node,

            # Achademio (Writer)
            "academic_rewrite": lambda p: get_achademio().rewrite_academic(p.get("text")),
            "academic_slides": lambda p: get_achademio().text_to_slides(p.get("text")),
            "academic_proofread": lambda p: get_achademio().proofread(p.get("text")),

            # LatteReview (Reviewer)
            "latte_screen": lambda p: get_latte_review().screen_papers(
                p.get("input_path"), 
                p.get("inclusion"), 
                p.get("exclusion"), 
                p.get("output_path")
            ),
            "latte_score": lambda p: get_latte_review().score_papers(
                p.get("input_path"), 
                p.get("task"), 
                p.get("set", [0,1,2]), 
                p.get("rules"), 
                p.get("output_path")
            ),

            # EmailMessenger (Notifier)
            "send_email": lambda p: get_email_messenger().send_email(
                p.get("to"), p.get("subject"), p.get("body"), p.get("attachments")
            ),
            "notify_user": lambda p: get_email_messenger().notify_user(
                p.get("email"), p.get("message"), p.get("channels"), p.get("file")
            ),

            # Browser Automation (Playwright)
            "browse_stealth": self._tool_browse_stealth,
            "browse_general": self._tool_browse_general,
            "browse_pdf": self._tool_browse_pdf,

            # Deep Drive (Forensics)
            "deep_drive_analyze": lambda p: get_deep_drive().analyze_authorship(p.get("text"), p.get("task", "clef24")),

            # Scholar Copilot (Writing Assist)
            "scholar_complete": lambda p: get_scholar_copilot().complete_text(p.get("text")),
            
            # Summarize (Native LLM)
            "summarize_content": self._tool_summarize_content
        }
        
        self.skills = {} # Will load skills later
        
        # State
        self.loop_data = LoopData()
        self.is_running = False
        self._channels_started = False

    async def _handle_external_trigger(self, message: str):
        """Handle input from Cron or Channels."""
        await self.bus.push_inbound(InboundMessage(content=message, source="system_trigger"))

    async def _tool_send_message(self, params: dict) -> str:
        """Tool to send message via MessageBus."""
        content = params.get("content")
        target = params.get("target") or "discord"
        chat_id = params.get("chat_id")
        if not content or not chat_id: return "Error: content and chat_id required"
        
        await self.bus.push_outbound(OutboundMessage(content=content, target=target, chat_id=chat_id))
        return "Message queued for delivery."

    async def _tool_manage_cron(self, params: dict) -> str:
        """Tool to manage cron jobs."""
        action = params.get("action", "list")
        if action == "add":
            return self.cron.add_job(params["name"], params["schedule"], params["instruction"])
        elif action == "remove":
            return self.cron.remove_job(params["job_id"])
        return self.cron.list_jobs()

    async def start_services(self):
        """Start background services (Bus, Cron, Channels)."""
        if self._channels_started: return
        
        await self.bus.start()
        await self.cron.start()
        self._channels_started = True

    async def stop_services(self):
        await self.bus.stop()
        await self.cron.stop()

    async def _spawn_subagent(self, params: dict) -> str:
        task = params.get("task")
        label = params.get("label", "subagent")
        if not task: return "Error: 'task' parameter required"
        
        try:
            from agent_zero.enhanced import get_agent_zero_enhanced
            return await get_agent_zero_enhanced().spawn_background_task(task, label)
        except Exception as e:
            return f"Failed to spawn agent: {str(e)}"

    async def _tool_deep_research(self, params: dict) -> str:
        """
        Conduct deep research using SurfSense options.
        Pipeline: Plan -> Search -> Crawl -> Curate -> Resaon.
        """
        query = params.get("query")
        if not query: return "Error: 'query' required"
        
        try:
            # 1. Imports (Lazy to avoid circular deps if any)
            from agent_zero.web_research import (
                SearchPlanner, SearchQuery, SurfSense, Executor, 
                Curator, Reasoner, CrawlConfig, CuratorConfig
            )
            
            # 2. Plan
            planner = SearchPlanner()
            search_query = SearchQuery(question=query)
            # Simple source planning (default to PubMed/Wiki for now)
            sources = planner.recommend_sources(search_query) 
            
            # 3. Construct Search URLs (Simple Mapping for Demo)
            start_urls = []
            for source in sources:
                if source == "PubMed":
                    start_urls.append(f"https://pubmed.ncbi.nlm.nih.gov/?term={query.replace(' ', '+')}")
                elif source == "Wikipedia":
                    start_urls.append(f"https://en.wikipedia.org/w/index.php?search={query.replace(' ', '+')}")
                elif source == "Google Scholar":
                    # Note: Scholar often challenges bots, but we include it per planner
                    start_urls.append(f"https://scholar.google.com/scholar?q={query.replace(' ', '+')}")
            
            if not start_urls:
                start_urls = [f"https://google.com/search?q={query.replace(' ', '+')}"]

            # 4. Crawl (SurfSense)
            executor = Executor()
            surfsense = SurfSense()
            crawl_config = CrawlConfig(
                urls=start_urls,
                rules=surfsense.create_default_rules(),
                depth=1, # Keep shallow for speed in demo
                max_pages=5
            )
            
            results = await surfsense.crawl(crawl_config, executor)
            
            # 5. Curate (Save to Disk)
            curator = Curator(config=CuratorConfig(base_path=f"{self.config.workspace_path}/web_research"))
            await curator.save_results(results, query)
            
            # 6. Reason (Synthesize Answer)
            reasoner = Reasoner()
            reasoner.set_llm_adapter(self.llm_adapter)
            answer = await reasoner.synthesize_answer(query, results)
            
            return reasoner.format_answer_with_citations(answer)
            
        except Exception as e:
            logger.error(f"Deep Research Failed: {e}")
            return f"Deep research failed: {str(e)}"
        


    async def _tool_browse_stealth(self, params: dict) -> str:
        """Tool for stealthy deep research browsing."""
        url = params.get("url")
        if not url: return "Error: url required"
        # Using the imported async function from modules.headless_research
        res = await stealth_deep_research(url)
        # Check status and return formatted string
        if res.get("status") == "success":
            content = res.get("content", "")
            return f"Stealth Browse Successful.\nTitle: {res.get('title')}\nLength: {len(content)}\n\n{content[:2000]}...\n[Content Truncated]"
        return f"Stealth Browse Failed: {res.get('error')}"

    async def _tool_browse_general(self, params: dict) -> str:
        """Tool for general browser scraping (non-stealth or login-based)."""
        url = params.get("url")
        wait_for = params.get("wait_for", "body")
        if not url: return "Error: url required"
        
        # Get singleton and run
        scraper = get_browser_scraper()
        res = await scraper.scrape_page(url, wait_for)
        
        if res.get("success"):
            content = res.get("content", "")
            return f"Browse Successful.\nTitle: {res.get('title')}\nLength: {len(content)}\n\n{content[:2000]}...\n[Content Truncated]"
        return f"Browse Failed: {res.get('error')}"

    async def _tool_browse_pdf(self, params: dict) -> str:
        """Tool to download PDF."""
        url = params.get("url")
        if not url: return "Error: url required"
        
        scraper = get_browser_scraper()
        path = await scraper.download_pdf(url)
        
        if path:
            return f"PDF Downloaded Successfully to: {path}"
        return "PDF Download Failed."

    async def _tool_summarize_content(self, params: dict) -> str:
        """Native summarization using the agent's LLM."""
        text = params.get("text")
        url = params.get("url")
        
        content_to_summarize = text
        if url:
            # If URL provided, try to scrape it first
            if not content_to_summarize:
                res = await self._tool_browse_general({"url": url})
                content_to_summarize = res
        
        if not content_to_summarize:
            return "Error: 'text' or 'url' parameter required."
            
        prompt = f"Please provide a concise summary of the following content:\n\n{content_to_summarize[:10000]}"
        return await self.llm_adapter.generate(prompt)

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
    from runtime.config_loader import load_config
    
    # Load real config from Settings
    cfg = load_config()
    ai_config = cfg.get("ai_provider", {})
    
    mode = ai_config.get("mode", "lm_studio")
    
    # Map settings to OrchestratorConfig
    llm_config = OrchestratorConfig(
        primary_model=mode,
        # Map common fields for LLMFactory
        openai_key=ai_config.get("openai_key"),
        anthropic_key=ai_config.get("anthropic_key"),
        google_key=ai_config.get("google_key"),
        groq_key=ai_config.get("groq_key"),
        openrouter_key=ai_config.get("openrouter_key"),
        deepseek_key=ai_config.get("deepseek_key"),
        
        # Custom/Local fields
        custom_base_url=ai_config.get("custom_base_url") or ai_config.get("lm_studio_url") or "http://localhost:1234/v1",
        custom_model=ai_config.get("custom_model") or ai_config.get("lm_studio_model") or "auto",
        custom_key=ai_config.get("custom_key"),
        
        # Ollama
        ollama_host=ai_config.get("ollama_host") or "http://localhost:11434",
        ollama_model=ai_config.get("ollama_model") or "llama2"
    )
    
    # Ensure attributes exist for LLMFactory if OrchestratorConfig doesn't have them
    # Explicitly set LM Studio attributes for LLMFactory
    llm_config.lm_studio_url = ai_config.get("lm_studio_url") or "http://localhost:1234/v1"
    llm_config.lm_studio_model = ai_config.get("lm_studio_model") or "auto"
    
    agent_config = AgentConfig(
        name="BioDockify AI",
        workspace_path=workspace
    )
    
    return HybridAgent(agent_config, llm_config)

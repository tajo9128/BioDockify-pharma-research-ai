"""
Research Router
Handles research task management and real-time updates.
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from pydantic import BaseModel

# Import Orchestrator (Adjust path as needed in main execution)
try:
    from orchestration.planner.orchestrator import ResearchOrchestrator, OrchestratorConfig
except ImportError:
    # Fallback/Mock for valid linting if orchestration module isn't in path during dev
    ResearchOrchestrator = None

router = APIRouter()

# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------

class ResearchRequest(BaseModel):
    title: str
    mode: str = "local"  # "local" or "cloud"

class TaskResponse(BaseModel):
    success: bool
    message: str
    task_id: str

class TaskStatus(BaseModel):
    task_id: str
    status: str  # pending, running, completed, failed
    progress: int
    logs: List[str]
    result: Optional[dict] = None
    created_at: str

# -----------------------------------------------------------------------------
# State & WebSocket Manager
# -----------------------------------------------------------------------------

class ConnectionManager:
    """Thread-safe WebSocket connection manager."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        async with self._lock:
            connections = self.active_connections.copy()
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection may have closed, remove it
                await self.disconnect(connection)

manager = ConnectionManager()

# Agent Thinking State (for real-time status UI)
class AgentThinkingState:
    """Tracks agent reasoning and execution state for UI display."""
    
    def __init__(self):
        self.current_task: Optional[str] = None
        self.current_step: int = 0
        self.total_steps: int = 0
        self.thinking_traces: List[Dict] = []
        self.execution_log: List[Dict] = []
        self.is_running: bool = False
        self.progress_percent: int = 0
        
    def start_task(self, task_name: str, total_steps: int = 1):
        self.current_task = task_name
        self.total_steps = total_steps
        self.current_step = 0
        self.is_running = True
        self.thinking_traces = []
        self.execution_log = []
        self.progress_percent = 0
        
    def add_thinking(self, step: str, reasoning: str):
        self.thinking_traces.append({
            "step": step,
            "reasoning": reasoning,
            "timestamp": datetime.now().isoformat()
        })
        
    def log_execution(self, action: str, status: str, details: Optional[dict] = None):
        self.execution_log.append({
            "action": action,
            "status": status,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        })
        
    def advance_step(self):
        self.current_step += 1
        if self.total_steps > 0:
            self.progress_percent = min(100, int(self.current_step / self.total_steps * 100))
            
    def complete(self):
        self.is_running = False
        self.progress_percent = 100
        
    def get_status(self) -> dict:
        return {
            "current_task": self.current_task,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "progress_percent": self.progress_percent,
            "is_running": self.is_running,
            "latest_thinking": self.thinking_traces[-1] if self.thinking_traces else None,
            "recent_log": self.execution_log[-5:] if self.execution_log else []
        }

agent_state = AgentThinkingState()

# Persistent task store (SQLite-backed for production reliability)
from runtime.task_store import get_task_store, TaskStore

def get_tasks() -> TaskStore:
    """Get the persistent task store."""
    return get_task_store()

# Compatibility wrapper for existing code
class TasksWrapper:
    """Wrapper providing dict-like access to persistent TaskStore."""
    
    def __getitem__(self, task_id: str):
        task = get_task_store().get_task(task_id)
        if task is None:
            raise KeyError(task_id)
        return TaskStatusProxy(task_id, task)
    
    def __setitem__(self, task_id: str, value):
        store = get_task_store()
        # Ensure task exists
        if store.get_task(task_id) is None:
            # Create with title if available
            store.create_task(task_id, value.title if hasattr(value, 'title') else "")
            
        # Update all fields from the value object
        updates = {}
        if hasattr(value, 'status'): updates['status'] = value.status
        if hasattr(value, 'progress'): updates['progress'] = value.progress
        if hasattr(value, 'result'): updates['result'] = value.result
        if hasattr(value, 'logs'): updates['logs'] = value.logs
        if hasattr(value, 'created_at'): updates['created_at'] = value.created_at
        
        if updates:
            store.update_task(task_id, **updates)
    
    def __contains__(self, task_id: str) -> bool:
        return get_task_store().get_task(task_id) is not None
    
    def values(self):
        # This might fail if store returns dicts that don't match TaskStatus exactly
        # forcing loose construction or just returning dicts if model allows
        return [TaskStatus(**t) for t in get_task_store().list_tasks()]

class TaskStatusProxy:
    """Proxy object for updating task status in store."""
    def __init__(self, task_id: str, task_data: dict):
        self._task_id = task_id
        self._data = task_data
        
    @property
    def task_id(self):
        return self._task_id

    @property
    def created_at(self):
        return self._data.get("created_at", "")
    
    @property
    def status(self):
        return self._data.get("status", "pending")
    
    @status.setter
    def status(self, value):
        get_task_store().update_task(self._task_id, status=value)
        self._data["status"] = value
    
    @property
    def progress(self):
        return self._data.get("progress", 0)
    
    @progress.setter
    def progress(self, value):
        get_task_store().update_task(self._task_id, progress=value)
        self._data["progress"] = value
    
    @property
    def logs(self):
        return TaskLogsProxy(self._task_id, self._data.get("logs", []))
    
    @property
    def result(self):
        return self._data.get("result")
    
    @result.setter
    def result(self, value):
        get_task_store().update_task(self._task_id, result=value)
        self._data["result"] = value
    
    def dict(self):
        # Merge task_id into the data for dict representation
        d = self._data.copy()
        d['task_id'] = self._task_id
        return d

class TaskLogsProxy(list):
    """Proxy for task logs that persists changes."""
    def __init__(self, task_id: str, logs: list):
        super().__init__(logs)
        self._task_id = task_id
    
    def append(self, log: str):
        super().append(log)
        get_task_store().append_log(self._task_id, log)

tasks = TasksWrapper()

# -----------------------------------------------------------------------------
# Background Task Logic
# -----------------------------------------------------------------------------

async def run_research_task(task_id: str, title: str, mode: str):
    """
    Executes the research orchestration in the background and streams updates.
    """
    # 1. Init
    tasks[task_id].status = "running"
    tasks[task_id].logs.append(f"Starting research on: {title} (Mode: {mode})")
    
    # Initialize agent thinking state for real-time UI updates
    agent_state.start_task(f"Research: {title}", total_steps=5)
    agent_state.add_thinking("Initialization", f"Starting {mode} research on topic: {title}")
    agent_state.log_execution("task_init", "success", {"task_id": task_id, "mode": mode})
    
    await manager.broadcast({
        "type": "task_update",
        "data": tasks[task_id].dict()
    })

    try:
        from runtime.config_loader import load_config
        config = load_config()
        
        # WEB DEEP RESEARCH MODE (MiroThinker Integration)
        if mode == "web_deep":
            tasks[task_id].logs.append("Initializing MiroThinker Web Engine...")
            from modules.web_research.engine import WebResearchEngine
            engine = WebResearchEngine(config)
            
            # Step 1: Search
            tasks[task_id].progress = 10
            tasks[task_id].logs.append(f"Searching web for: {title}...")
            await manager.broadcast({"type": "task_update", "data": tasks[task_id].dict()})
            
            # Run async search directly
            results = await engine.search_google(title, 5)
            tasks[task_id].logs.append(f"Found {len(results)} relevant sources.")
            
            # Step 2: Deep Read
            tasks[task_id].progress = 30
            tasks[task_id].logs.append("Deep reading and scraping content...")
            await manager.broadcast({"type": "task_update", "data": tasks[task_id].dict()})
            
            full_context = ""
            for i, res in enumerate(results):
                msg = f"Reading: {res.get('title', 'Unknown')}"
                tasks[task_id].logs.append(msg)
                
                # Update agent thinking state
                agent_state.add_thinking("Deep Reading", f"Extracting content from: {res.get('title', 'Unknown')[:50]}...")
                agent_state.advance_step()
                
                content = await engine.deep_read(res['link'])
                full_context += f"# Source: {res['title']}\nURL: {res['link']}\n\n{content}\n\n"
                
                # Update progress
                current_prog = 30 + int((i+1)/len(results) * 40) # 30 to 70
                tasks[task_id].progress = current_prog
                agent_state.log_execution("deep_read", "success", {"source": res.get('title', '')[:30]})
                await manager.broadcast({"type": "task_update", "data": tasks[task_id].dict()})
            
            # Step 3: Synthesis with LLM
            tasks[task_id].progress = 80
            tasks[task_id].logs.append("Synthesizing research report with AI...")
            agent_state.add_thinking("Synthesis", "Generating comprehensive research report using AI analysis...")
            agent_state.advance_step()
            await manager.broadcast({"type": "task_update", "data": tasks[task_id].dict()})
            
            try:
                # Get Primary LLM
                from modules.llm.factory import LLMFactory
                # Ensure we have an object-like config for the factory if it's a dict
                class ConfigWrapper:
                    def __init__(self, d): self.__dict__ = d
                
                ai_cfg = config.get("ai_provider", {})
                # Create a config object compatible with key access for factory
                # We need to map dict keys to object attributes effectively or just use the dict if factory supports it
                # The factory expects an object with attributes.
                
                # Simple object mock
                class MockConfig:
                    def __init__(self, cfg):
                        self.google_key = cfg.get("google_key")
                        self.openrouter_key = cfg.get("openrouter_key")
                        self.huggingface_key = cfg.get("huggingface_key")
                        self.glm_key = cfg.get("glm_key")
                        self.custom_key = cfg.get("custom_key")
                        self.custom_base_url = cfg.get("custom_base_url")
                        self.custom_model = cfg.get("custom_model")
                        self.ollama_url = cfg.get("ollama_url")
                        self.ollama_model = cfg.get("ollama_model")
                        self.primary_model = cfg.get("primary_model", "google")

                adapter = LLMFactory.get_adapter(ai_cfg.get("primary_model", "google"), MockConfig(ai_cfg))
                
                if adapter:
                    prompt = f"""
                    You are an expert research analyst. Synthesize the following raw web search data into a comprehensive research report about "{title}".
                    
                    Structure:
                    1. Executive Summary
                    2. Key Findings
                    3. Detailed Analysis
                    4. Sources Analysis
                    
                    RAW DATA:
                    {full_context[:50000]}  # Limit context to avoid overflow
                    """
                    
                    report = await asyncio.to_thread(adapter.generate, prompt)
                    tasks[task_id].logs.append("Report generation complete.")
                else:
                    report = f"## Research Analysis\n\nAI Synthesis Failed: No valid AI provider configured.\n\n### Raw Data\n{full_context}"
                    tasks[task_id].logs.append("AI generation skipped (no provider).")

            except Exception as e:
                tasks[task_id].logs.append(f"AI Synthesis Error: {e}")
                report = f"## Research Analysis\n\nError during synthesis: {e}\n\n### Raw Data\n{full_context}"

            # For now, we save raw context + report
            tasks[task_id].result = {
                "summary": "Deep Web Research Complete",
                "sources": results,
                "full_report": report,
                "raw_context": full_context
            }
            
        else:
            # 2. Standard Simulation (Legacy/Orchestrator)
            # Note: In a real async setup, we might need to run the blocking orchestrator in a threadpool
            # For now, we simulate the steps to demonstrate the UI flow
            
            steps = ["Literature Search", "Entity Extraction", "Molecular Analysis", "Knowledge Graph", "Synthesis"]
            
            # Real Orchestrator Call (if available)
            plan = None
            if ResearchOrchestrator:
                 # This is a synchronous call, might block the event loop slightly if not threaded
                 # In production: await run_in_threadpool(orchestrator.plan_research, title)
                 pass
            
            for i, step in enumerate(steps):
                await asyncio.sleep(2) # Simulate work
                
                progress = int((i + 1) / len(steps) * 100)
                tasks[task_id].progress = progress
                tasks[task_id].logs.append(f"Completed step: {step}")
                
                # Broadcast update
                await manager.broadcast({
                    "type": "task_update",
                    "data": tasks[task_id].dict()
                })
        
        # 3. Complete
        tasks[task_id].status = "completed"
        tasks[task_id].progress = 100
        tasks[task_id].logs.append("Research completed successfully.")
        
        if not tasks[task_id].result:
             tasks[task_id].result = {"summary": f"Research on {title} complete.", "plan_id": "plan_123"}
        
        await manager.broadcast({
            "type": "task_update",
            "data": tasks[task_id].dict()
        })

    except Exception as e:
        tasks[task_id].status = "failed"
        tasks[task_id].logs.append(f"Error: {str(e)}")
        await manager.broadcast({
            "type": "task_update",
            "data": tasks[task_id].dict()
        })

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.post("/start", response_model=TaskResponse)
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    """Start a new research task."""
    task_id = f"task_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
    
    # Create task record
    tasks[task_id] = TaskStatus(
        task_id=task_id,
        status="pending",
        progress=0,
        logs=["Task initialized."],
        created_at=datetime.now().isoformat()
    )
    
    # Start background execution
    background_tasks.add_task(run_research_task, task_id, request.title, request.mode)
    
    return TaskResponse(
        success=True,
        message="Research task started successfully",
        task_id=task_id
    )

@router.get("/status/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get status of a specific task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

@router.get("/tasks", response_model=List[TaskStatus])
async def list_tasks():
    """List all tasks."""
    return list(tasks.values())

@router.websocket("/ws/status")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time task updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client messages if any (ping/pong)
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@router.websocket("/ws/agent-thinking")
async def agent_thinking_stream(websocket: WebSocket):
    """
    WebSocket for real-time agent thinking traces.
    Clients receive status updates every second while the agent is running.
    """
    await websocket.accept()
    try:
        while True:
            status = agent_state.get_status()
            await websocket.send_json({
                "type": "agent_status",
                "data": status
            })
            await asyncio.sleep(1)  # Send updates every second
    except WebSocketDisconnect:
        pass  # Client disconnected


@router.get("/agent-status")
async def get_agent_status():
    """Get current agent execution status (polling alternative to WebSocket)."""
    return agent_state.get_status()

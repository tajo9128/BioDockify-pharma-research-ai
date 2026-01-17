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
        if store.get_task(task_id) is None:
            store.create_task(task_id, value.title if hasattr(value, 'title') else "")
    
    def __contains__(self, task_id: str) -> bool:
        return get_task_store().get_task(task_id) is not None
    
    def values(self):
        return [TaskStatus(**t) for t in get_task_store().list_tasks()]

class TaskStatusProxy:
    """Proxy object for updating task status in store."""
    def __init__(self, task_id: str, task_data: dict):
        self._task_id = task_id
        self._data = task_data
    
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
        return self._data

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
    await manager.broadcast({
        "type": "task_update",
        "data": tasks[task_id].dict()
    })

    try:
        # 2. Simulate or Run Orchestrator
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


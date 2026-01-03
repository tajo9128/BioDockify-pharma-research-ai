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
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# In-memory task store (Replace with DB/Redis in production)
tasks: Dict[str, TaskStatus] = {}

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
        manager.disconnect(websocket)

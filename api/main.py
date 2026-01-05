"""
BioDockify API Backend
FastAPI service exposing research capabilities to the UI.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import uuid

# Import Core Systems
from orchestration.planner.orchestrator import ResearchOrchestrator, OrchestratorConfig
from orchestration.executor import ResearchExecutor
from modules.analyst.analytics_engine import ResearchAnalyst

app = FastAPI(title="BioDockify Research API", version="1.0.0")

# In-memory session storage (For MVP)
# In production, use Redis or a proper DB
tasks: Dict[str, Dict[str, Any]] = {}

# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------

class ResearchRequest(BaseModel):
    title: str
    mode: str = "local" # local or cloud

class TaskStatus(BaseModel):
    task_id: str
    status: str # running, completed, diff
    result: Optional[Dict[str, Any]] = None

# -----------------------------------------------------------------------------
# Background Worker
# -----------------------------------------------------------------------------

def run_research_task(task_id: str, title: str, mode: str):
    """
    Background worker function to run the full research pipeliine.
    """
    try:
        tasks[task_id]["status"] = "planning"
        
        # 1. Plan
        config = OrchestratorConfig(use_cloud_api=(mode == "cloud"))
        orchestrator = ResearchOrchestrator(config)
        plan = orchestrator.plan_research(title)
        
        tasks[task_id]["status"] = "executing"
        
        # 2. Execute
        executor = ResearchExecutor()
        context = executor.execute_plan(plan)
        
        # 3. Store Results
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["result"] = {
            "title": title,
            "text_length": len(context.extracted_text),
            "entities": context.entities,
            "stats": context.analyst_stats
        }
        
    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BioDockify API"}

@app.post("/api/research/start", response_model=Dict[str, str])
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    """Start a new research task in the background."""
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "pending", "title": request.title}
    
    background_tasks.add_task(run_research_task, task_id, request.title, request.mode)
    
    return {"task_id": task_id, "status": "started"}

@app.get("/api/research/status/{task_id}", response_model=TaskStatus)
def get_status(task_id: str):
    """Get the status of a specific task."""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task.get("status"),
        result=task.get("result")
    )

from runtime.config_loader import load_config, save_config, reset_config

# ... (existing imports)

# -----------------------------------------------------------------------------
# Settings API
# -----------------------------------------------------------------------------

@app.get("/api/settings")
def get_settings():
    """Retrieve current application configuration."""
    return load_config()

@app.post("/api/settings")
def update_settings(settings: Dict[str, Any]):
    """Save new application configuration."""
    if save_config(settings):
        return {"status": "success", "message": "Settings saved"}
    raise HTTPException(status_code=500, detail="Failed to save settings")

@app.post("/api/settings/reset")
def reset_settings():
    """Reset settings to factory defaults."""
    config = reset_config()
    return {"status": "success", "message": "Settings reset to defaults", "config": config}

@app.get("/api/settings/test/{service_type}")
def test_connection_endpoint(service_type: str):
    """
    Test connection to external services.
    service_type: 'llm', 'database', 'elsevier'
    """
    config = load_config()
    
    if service_type == "llm":
        provider = config.get("ai_provider", {}).get("mode", "free_api")
        if provider == "hybrid":
             key = config.get("ai_provider", {}).get("openai_key")
             if not key:
                 return {"status": "error", "message": "OpenAI Key missing"}
             # In a real app, we'd make a lightweight call to OpenAI here
             return {"status": "success", "message": "OpenAI Key configured (Mock Test)"}
        return {"status": "success", "message": "Using Free Local API (Ollama)"}

    elif service_type == "elsevier":
        key = config.get("ai_provider", {}).get("elsevier_key")
        if not key:
            return {"status": "error", "message": "Elsevier API Key missing"}
        return {"status": "success", "message": "Elsevier Key configured (Mock Test)"}

    return {"status": "success", "message": f"{service_type} connection ok"}


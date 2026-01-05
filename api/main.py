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

# -----------------------------------------------------------------------------
# Persistence Layer (Disk-Based)
# -----------------------------------------------------------------------------
from runtime.task_manager import task_manager

# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------

class ResearchRequest(BaseModel):
    title: str
    mode: str = "synthesize" # search, synthesize, write
    
class TaskStatus(BaseModel):
    task_id: str
    status: str # running, completed, suspended, failed
    result: Optional[Dict[str, Any]] = None
    progress: int = 0
    message: Optional[str] = None

# -----------------------------------------------------------------------------
# Background Worker
# -----------------------------------------------------------------------------

def run_research_task(task_id: str, title: str, mode: str):
    """
    Background worker function to run the full research pipeliine.
    """
    try:
        # Load or Init Task
        task = task_manager.load_task(task_id)
        if not task: 
             task = {"task_id": task_id, "title": title, "status": "planning"}

        task["status"] = "planning"
        task_manager.save_task(task_id, task)
        
        # 1. Plan
        # Load runtime config properly
        from runtime.config_loader import load_config
        runtime_cfg = load_config()
        
        
        # Determine cloud usage from config, not just request
        use_cloud = runtime_cfg.get("ai_provider", {}).get("mode") == "hybrid"
        user_persona = runtime_cfg.get("user_persona", {})
        
        config = OrchestratorConfig(
            use_cloud_api=use_cloud,
            user_persona=user_persona
        )
        orchestrator = ResearchOrchestrator(config)
        
        # Pass the research mode to the planner
        plan = orchestrator.plan_research(title, mode=mode)
        
        task["status"] = "executing"
        task_manager.save_task(task_id, task)
        
        # 2. Execute
        # Pass task_id into executor for granular checkpointing
        executor = ResearchExecutor(task_id=task_id) 
        context = executor.execute_plan(plan)
        
        # 3. Store Results
        task["status"] = "completed"
        task["result"] = {
            "title": title,
            "text_length": len(context.extracted_text),
            "entities": context.entities,
            "stats": context.analyst_stats
        }
        task_manager.save_task(task_id, task)
        
    except Exception as e:
        task = task_manager.load_task(task_id) or {}
        task["status"] = "failed"
        task["error"] = str(e)
        task_manager.save_task(task_id, task)


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
    
    # Init Valid Task State on Disk immediately
    initial_state = {
        "task_id": task_id,
        "title": request.title, 
        "status": "pending",
        "created_at": str(uuid.uuid1().time) # timestamp proxy
    }
    task_manager.save_task(task_id, initial_state)
    
    background_tasks.add_task(run_research_task, task_id, request.title, request.mode)
    
    return {"task_id": task_id, "status": "started"}

@app.get("/api/research/status/{task_id}", response_model=TaskStatus)
def get_status(task_id: str):
    """Get the status of a specific task."""
    task = task_manager.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskStatus(
        task_id=task_id,
        status=task.get("status", "unknown"),
        result=task.get("result"),
        progress=task.get("progress", 0),
        message=task.get("message")
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

class TestRequest(BaseModel):
    service_type: str # llm, elsevier
    provider: Optional[str] = None # google, openrouter, huggingface
    key: Optional[str] = None

@app.post("/api/settings/test")
def test_connection_endpoint(request: TestRequest):
    """
    Test connection to external services with provided credentials.
    """
    if request.service_type == "llm":
        if not request.key:
             return {"status": "error", "message": "API Key is missing"}

        provider = request.provider
        if provider == "google":
             # Basic regex check or lightweight call could go here
             if not request.key.startswith("AIza"):
                 return {"status": "warning", "message": "Invalid Google Key format (should start with AIza)"}
             # Mock Validation success
             return {"status": "success", "message": "Google Gemini Key is valid (Mock)"}
             
        elif provider == "openrouter":
             if not request.key.startswith("sk-or-"):
                 return {"status": "warning", "message": "Invalid OpenRouter Key format (should start with sk-or-)"}
             return {"status": "success", "message": "OpenRouter Key is valid (Mock)"}
       
        elif provider == "huggingface":
             if not request.key.startswith("hf_"):
                 return {"status": "warning", "message": "Invalid User Access Token (should start with hf_)"}
             return {"status": "success", "message": "HuggingFace Token is valid (Mock)"}
        
        return {"status": "error", "message": f"Unknown provider: {provider}"}

    elif request.service_type == "elsevier":
        if not request.key:
            return {"status": "error", "message": "Elsevier Key missing"}
        return {"status": "success", "message": "Elsevier Key configured (Mock Test)"}

    return {"status": "error", "message": f"Unknown service type: {request.service_type}"}

class OllamaCheckRequest(BaseModel):
    base_url: str

@app.post("/api/settings/ollama/check")
def check_ollama_endpoint(request: OllamaCheckRequest):
    """
    Check availability of Ollama server and fetch models.
    """
    import requests
    try:
        # 1. Ping Validation (timeout 2s for quick UI response)
        url = f"{request.base_url.rstrip('/')}/api/tags"
        resp = requests.get(url, timeout=2)
        resp.raise_for_status()
        
        data = resp.json()
        models = [m['name'] for m in data.get('models', [])]
        
        return {
            "status": "success", 
            "message": "Ollama is running", 
            "models": models
        }
    except requests.exceptions.ConnectionError:
        return {"status": "error", "message": "Could not connect to Ollama. Is it running?", "models": []}
    except Exception as e:
        return {"status": "error", "message": str(e), "models": []}


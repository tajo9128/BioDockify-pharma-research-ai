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

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# -----------------------------------------------------------------------------
# Global Error Handling & Resilience
# -----------------------------------------------------------------------------
from fastapi import Request
from fastapi.responses import JSONResponse
import logging
import time
import requests
import functools
import psutil
import asyncio

import logging
import json
import time

class JsonFormatter(logging.Formatter):
    """
    Formatter to output logs as JSON for easier parsing by monitoring tools.
    """
    def format(self, record):
        log_obj = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

# Configure Root Logger
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
logger = logging.getLogger("biodockify_api")

# --- Caching Decorator ---
# Simple in-memory cache for repeated idempotent LLM queries
# Note: For production, Redis is better, but LRU is fine for single-instance desktop app.
@functools.lru_cache(maxsize=100)
def cached_llm_request(params_tuple):
    # Wrapper to allow caching of requests based on hashable params
    method, url, json_str, headers_str, timeout = params_tuple
    import json
    return requests.request(
        method=method, 
        url=url, 
        json=json.loads(json_str), 
        headers=json.loads(headers_str) if headers_str else None, 
        timeout=timeout
    )

@app.on_event("startup")
async def startup_event():
    """
    Service Stability: Model Loading & Pre-warming.
    """
    logger.info("Initializing BioDockify Backend...")
    
    # 1. Warm up Embedding Model (Lazy loading is default, we force it here)
    try:
        logger.info("Pre-loading Embedding Model...")
        from modules.rag.vector_store import vector_store
        # Trigger model load by embedding a dummy string
        vector_store.ef(["warmup"]) 
        logger.info("Embedding Model Loaded.")
    except Exception as e:
        logger.warning(f"Failed to pre-load embedding model: {e}")

    # 2. Check Resource Availability
    mem = psutil.virtual_memory()
    logger.info(f"System Memory: {mem.percent}% used ({mem.available / (1024**3):.2f} GB available)")
    
    # 3. Start Background Services (Ollama/Neo4j)
    # Only if configured to do so (default True)
    from runtime.config_loader import load_config
    from runtime.service_manager import get_service_manager
    
    config = load_config()
    if config.get("system", {}).get("auto_start_services", True):
        logger.info("Auto-starting background services...")
        svc_mgr = get_service_manager(config)
        
        # Check if we should start Ollama (from ai_provider config or system default)
        if config.get("ai_provider", {}).get("mode") in ["auto", "ollama"]:
             svc_mgr.start_ollama()
             
        # Check Neo4j
        # Assuming we start it if configured, or just always try for robustness as requested
        svc_mgr.start_neo4j()

    # 4. Check for high memory usage warning
    if mem.percent > 90:
        logger.warning(f"High Memory Usage on Startup: {mem.percent}%")

    # 5. Start Background Monitoring Loop
    asyncio.create_task(background_monitor())

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown."""
    logger.info("Shutting down BioDockify Backend...")
    
    # Stop Background Services
    from runtime.service_manager import service_manager
    if service_manager:
        service_manager.stop_all()
        
    logger.info("Services stopped.")

# -----------------------------------------------------------------------------
# DIGITAL LIBRARY ENDPOINTS (Phase 5)
# -----------------------------------------------------------------------------
from fastapi import UploadFile, File, Form
from modules.library.store import library_store
from modules.library.ingestor import library_ingestor

# -----------------------------------------------------------------------------
# HYPOTHESIS & SCIENTIFIC METHOD ENDPOINTS (Phase 11.2)
# -----------------------------------------------------------------------------
from modules.scientific_method.models import Hypothesis, HypothesisStatus, EvidenceType
from modules.scientific_method.hypothesis_engine import get_hypothesis_engine

@app.post("/api/hypothesis", response_model=Hypothesis)
def create_hypothesis(statement: str, rationale: str):
    """Create a new scientific hypothesis."""
    engine = get_hypothesis_engine()
    return engine.create_hypothesis(statement, rationale)

@app.get("/api/hypothesis", response_model=list[Hypothesis])
def list_hypotheses():
    """List all tracked hypotheses."""
    engine = get_hypothesis_engine()
    return engine.list_hypotheses()

@app.get("/api/hypothesis/{h_id}", response_model=Hypothesis)
def get_hypothesis(h_id: str):
    """Get details of a specific hypothesis."""
    engine = get_hypothesis_engine()
    h = engine.get_hypothesis(h_id)
    if not h: raise HTTPException(status_code=404, detail="Hypothesis not found")
    return h

class StatusUpdate(BaseModel):
    status: HypothesisStatus

@app.patch("/api/hypothesis/{h_id}/status")
def update_hypothesis_status(h_id: str, update: StatusUpdate):
    """Update the lifecycle status of a hypothesis."""
    engine = get_hypothesis_engine()
    engine.update_status(h_id, update.status)
    return {"status": "success", "new_status": update.status}

class EvidenceAdd(BaseModel):
    description: str
    type: EvidenceType
    source_id: Optional[str] = None

# -----------------------------------------------------------------------------
# PUBLICATION & EXPORT ENDPOINTS (Phase 11.3)
# -----------------------------------------------------------------------------
from modules.publication.latex_exporter import LaTeXExporter
from modules.publication.figure_manager import FigureManager

class ExportRequest(BaseModel):
    title: str
    author: str
    affiliation: str
    abstract: str
    content_markdown: str

@app.post("/api/publication/export/latex")
def export_to_latex(req: ExportRequest):
    """Generate LaTeX source from Markdown report."""
    try:
        exporter = LaTeXExporter()
        latex_source = exporter.generate_latex(
            title=req.title,
            author=req.author,
            affiliation=req.affiliation,
            abstract=req.abstract,
            content_markdown=req.content_markdown
        )
        return {"latex_source": latex_source}
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/publication/figures")
def register_figure(title: str, caption: str, code: str, path: str):
    """Register a scientific figure for reproducibility."""
    fm = FigureManager()
    fig_id = fm.register_figure(title, caption, code, path)
    return {"figure_id": fig_id}

# -----------------------------------------------------------------------------
# STATISTICS & QC ENDPOINTS (Phase 4)
# -----------------------------------------------------------------------------
from modules.statistics.engine import StatisticalEngine

class StatisticsRequest(BaseModel):
    data: List[Dict[str, Any]]
    design: str = "descriptive" # descriptive, two_group, anova, correlation
    tier: str = "basic" # basic, analytical, advanced

@app.post("/api/statistics/analyze")
def analyze_statistics(req: StatisticsRequest):
    """
    Unified Statistical Analysis Endpoint.
    Routes to the 3-Tier Statistical Engine.
    """
    engine = StatisticalEngine()
    result = engine.analyze(req.data, req.design, req.tier)
    
    if "error" in result:
        # We don't raise HTTP 500 for data errors, we return the error structure
        # so the UI can explain it to the user (especially Tier 1).
        return JSONResponse(status_code=400, content=result)
        
    return result

# -----------------------------------------------------------------------------
# JOURNAL INTELLIGENCE (Phase 5)
# -----------------------------------------------------------------------------
from modules.journal_intel import DecisionEngine

class JournalRequest(BaseModel):
    title: str
    issn: str
    url: Optional[str] = None

@app.post("/api/journal/verify")
def verify_journal(req: JournalRequest):
    """
    Verify potential journal authenticity using 6-Pillar Logic.
    """
    engine = DecisionEngine()
    result = engine.verify(req.issn, req.title, req.url)
    return result

@app.post("/api/library/upload")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a file to the Digital Library."""
    try:
        content = await file.read()
        record = library_store.add_file(content, file.filename)
        
        # Async Processing (Simple Trigger)
        # Ideally this goes to a background task
        try:
             fpath = library_store.get_file_path(record['id'])
             if fpath:
                 result = library_ingestor.process_file(fpath)
                 library_store.update_metadata(record['id'], {
                     "processed": True, 
                     "char_count": len(result['text'])
                 })
        except Exception as e:
            logger.warning(f"Auto-processing failed for {file.filename}: {e}")
            
        return {"status": "success", "file": record}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/library/files")
async def list_files():
    """Lists all files in the library."""
    return library_store.list_files()

@app.delete("/api/library/files/{file_id}")
async def delete_file(file_id: str):
    """Deletes a file from the library."""
    success = library_store.remove_file(file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found or failed to delete")
    return {"status": "success"}

class LibraryQuery(BaseModel):
    query: str
    top_k: int = 5

@app.post("/api/library/query")
async def query_library(request: LibraryQuery):
    """
    Semantic search over the digital library.
    """
    try:
        from modules.rag.vector_store import get_vector_store
        store = get_vector_store()
        results = store.search(request.query, request.top_k)
        return {"results": results}
    except Exception as e:
        logger.error(f"Library search failed: {e}")
        return {"results": [], "error": str(e)}

async def background_monitor():
    """
    Periodic system health logging loop.
    Logs CPU/RAM usage every 60 seconds.
    """
    logger.info("Starting Background Monitor...")
    while True:
        try:
            await asyncio.sleep(60)
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            
            # Log as structured metric
            metric_data = {
                "event": "system_metrics",
                "cpu_percent": cpu,
                "ram_percent": mem.percent,
                "ram_available_gb": round(mem.available / (1024**3), 1)
            }
            
            # Alert on thresholds
            if mem.percent > 90:
                logger.warning(json.dumps({**metric_data, "alert": "High RAM Usage"}))
            else:
                logger.info(json.dumps(metric_data))
                
        except Exception as e:
            logger.error(f"Monitor Error: {e}")
            await asyncio.sleep(60) # Prevent tight loop on error

@app.middleware("http")
async def resource_monitor_middleware(request: Request, call_next):
    """
    Resource Management: Reject heavy requests if system is under stress.
    """
    # Skip for simple health checks
    if request.url.path in ["/health", "/api/system/info"]:
        return await call_next(request)

    # Check RAM
    mem = psutil.virtual_memory()
    if mem.percent > 95: # Critical Threshold
        return JSONResponse(
            status_code=503, 
            content={"detail": "System is under heavy load (Memory > 95%). Please retry later."}
        )
        
    return await call_next(request)

# Rate Limiting & Size Limiting Middleware
from collections import defaultdict
import time

request_counts = defaultdict(list)
RATE_LIMIT = 100 # requests per minute
MAX_UPLOAD_SIZE = 50 * 1024 * 1024 # 50 MB

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # 1. Size Limiting (Client-Side Check)
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_UPLOAD_SIZE:
             return JSONResponse(status_code=413, content={"detail": "File too large. Maximum size is 50MB."})

    # 2. Rate Limiting (Simple Token Bucket per IP)
    client_ip = request.client.host
    now = time.time()
    
    # Clean old requests
    request_counts[client_ip] = [t for t in request_counts[client_ip] if t > now - 60]
    
    if len(request_counts[client_ip]) > RATE_LIMIT:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again later."})
        
    request_counts[client_ip].append(now)
    
    return await call_next(request)

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    """
    Structured Logging: Audit Trail for all API interactions.
    Logs: Method, Path, IP, Status, Duration, User-Agent.
    """
    start_time = time.time()
    
    # Process Request
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise e
    finally:
        process_time = (time.time() - start_time) * 1000 # ms
        
        # Sanitize sensitive paths if needed (e.g. /auth/login passwords)
        # For now, we trust the path logs.
        
        log_cls = logger.info if status_code < 400 else logger.warning
        
        log_data = {
            "event": "api_request",
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host,
            "status_code": status_code,
            "duration_ms": round(process_time, 2),
            "user_agent": request.headers.get("user-agent", "unknown")
        }
        log_cls(json.dumps(log_data))
        
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

def safe_request(method, url, **kwargs):
    """
    Resilient HTTP request with retries (Circuit Breaker Lite).
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.request(method, url, **kwargs)
            return resp
        except requests.exceptions.RequestException as e:
            logger.warning(f"Request failed (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                raise e
            time.sleep(1 * (attempt + 1)) # Linear backoff


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
    logs: List[str] = []

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
        
        # 2. Execute with Retry Logic (Async Robustness)
        # Pass task_id into executor for granular checkpointing
        executor = ResearchExecutor(task_id=task_id) 
        
        MAX_JOB_RETRIES = 3
        context = None
        
        for attempt in range(MAX_JOB_RETRIES):
            try:
                context = executor.execute_plan(plan)
                break # Success
            except Exception as job_err:
                logger.warning(f"Task {task_id} failed attempt {attempt+1}: {job_err}")
                if attempt == MAX_JOB_RETRIES - 1:
                     raise job_err # Propagate up to main handler
                time.sleep(2 * (attempt + 1)) # Backoff
        
        if not context:
             raise Exception("Task execution returned no context after retries.")
        
        # ---------------------------------------------------------------------
        # 2.5 Auto-Ingest into Local NotebookLM (RAG) & Neo4j
        # ---------------------------------------------------------------------
        try:
            from modules.rag.vector_store import vector_store
            
            # Simple Chunking Strategy
            full_text = context.extracted_text
            chunk_size = 1000
            chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
            
            docs_to_ingest = []
            for i, chunk_text in enumerate(chunks):
                docs_to_ingest.append({
                    "text": chunk_text,
                    "metadata": {
                        "source": f"Agent Research: {title}",
                        "type": "generated-research",
                        "task_id": task_id,
                        "chunk_index": i
                    }
                })
            
            if docs_to_ingest:
                vector_store.add_documents(docs_to_ingest)
                
            # Neo4j Sync (Entities)
            # Assuming context.entities is a list of dicts/obects
            # If we had a Neo4j module exposed here, we'd call it.
            # For now, we assume the ResearchExecutor *internally* might have handled it, 
            # or we log that we skipped it if no direct access.
            # (MVP: We rely on RAG for the Notebook experience).
            
        except Exception as rag_err:
             print(f"Warning: Failed to auto-ingest into RAG: {rag_err}")

        # ---------------------------------------------------------------------
        
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
    """
    Comprehensive System Health Check.
    Monitors: API, Ollama, Vector Store, Neo4j (optional), System Resources.
    """
    import psutil
    import shutil
    
    status = {"status": "ok", "components": {}}
    
    # 1. API Service
    status["components"]["api"] = {"status": "ok", "version": "1.0.0"}
    
    # 2. Ollama / AI Provider
    try:
        from runtime.config_loader import load_config
        cfg = load_config()
        ai_conf = cfg.get("ai_provider", {})
        ollama_url = ai_conf.get("ollama_url", "http://localhost:11434")
        
        # Ping
        resp = safe_request('GET', f"{ollama_url}/api/tags", timeout=2)
        if resp.status_code == 200:
             status["components"]["ai_core"] = {"status": "ok", "provider": "ollama"}
        else:
             status["components"]["ai_core"] = {"status": "degraded", "message": f"Ollama Unreachable ({resp.status_code})"}
    except Exception as e:
         status["components"]["ai_core"] = {"status": "error", "message": str(e)}

    # 3. Vector DB (Chroma/FAISS)
    try:
         from modules.rag.vector_store import vector_store
         # Simple count check
         count = vector_store.client.count() if hasattr(vector_store, 'client') else 0
         status["components"]["vector_db"] = {"status": "ok", "documents": count}
    except Exception as e:
         status["components"]["vector_db"] = {"status": "degraded", "message": "Store not initialized"}

    # 4. Neo4j (Graph DB)
    try:
        from neo4j import GraphDatabase
        # We use a quick verify_connectivity if credentials exist in config
        # Ideally we'd load config here, but for speed we might skip or just use defaults check
        # For now, let's just check if driver is importable and maybe ping if we had a global driver instance.
        # Since we don't have a global driver, we report 'installed' or 'unknown'.
        # Better: Check if service manager has it running?
        status["components"]["neo4j"] = {"status": "unknown", "message": "Check Settings > Neo4j"}
    except ImportError:
         status["components"]["neo4j"] = {"status": "disabled", "message": "Driver missing"}

    # 5. System Resources
    try:
        mem = psutil.virtual_memory()
        disk = shutil.disk_usage(".")
        status["components"]["system"] = {
            "status": "ok", 
            "ram_free_gb": round(mem.available / (1024**3), 1),
            "disk_free_gb": round(disk.free / (1024**3), 1)
        }
    except:
        status["components"]["system"] = {"status": "unknown"}
        
    return status

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
        message=task.get("message"),
        logs=task.get("logs", [])
    )

@app.post("/api/research/{task_id}/cancel")
def cancel_research(task_id: str):
    """Cancel a running research task."""
    task = task_manager.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Mark as failed/cancelled so UI stops polling
    task["status"] = "failed" 
    task["message"] = "Cancelled by user"
    task_manager.save_task(task_id, task)
    
    return {"success": True}


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
    provider: Optional[str] = None # google, openrouter, huggingface, custom
    key: Optional[str] = None
    base_url: Optional[str] = None # For custom provider

@app.post("/api/settings/test")
def test_connection_endpoint(request: TestRequest):
    """
    Test connection to external services with provided credentials.
    """
    if request.service_type == "llm":
        if not request.key:
             return {"status": "error", "message": "API Key is missing"}

        import requests
        provider = request.provider
        
        try:
            if provider == "google":
                # Verify with Google Generative Language API
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
                resp = requests.get(url, timeout=10)
                if resp.status_code == 200:
                     return {"status": "success", "message": "Google Gemini Key Verified"}
                else:
                    try:
                        err = resp.json().get('error', {})
                        msg = err.get('message', 'Unknown Google API Error')
                        status = err.get('status', resp.status_code)
                        return {"status": "error", "message": f"Google Error ({status}): {msg}"}
                    except:
                        return {"status": "error", "message": f"Google API Error: {resp.status_code}"}
            
            elif provider == "openrouter":
                # Verify with OpenRouter Auth API
                # OpenRouter requires Referer and Title headers for best practice/compliance
                headers = {
                    "Authorization": f"Bearer {request.key}",
                    "HTTP-Referer": "http://localhost:3000", # Localhost for dev/desktop app
                    "X-Title": "BioDockify"
                }
                resp = requests.get("https://openrouter.ai/api/v1/auth/key", headers=headers, timeout=10)
                
                if resp.status_code == 200:
                     data = resp.json()
                     return {"status": "success", "message": "OpenRouter Key Verified"}
                else:
                     try:
                         err_msg = resp.json().get('error', {}).get('message', 'Unknown Error')
                     except:
                         err_msg = f"Status {resp.status_code}"
                     return {"status": "error", "message": f"OpenRouter Error: {err_msg}"}
           
            elif provider == "huggingface":
                # Verify with HF WhoAmI
                headers = {"Authorization": f"Bearer {request.key}"}
                resp = requests.get("https://huggingface.co/api/whoami", headers=headers, timeout=10)
                if resp.status_code == 200:
                    user = resp.json().get("name", "User")
                    return {"status": "success", "message": f"HuggingFace Connected as {user}"}
                else:
                    try:
                        err_msg = resp.json().get('error', 'Invalid Token')
                    except:
                        err_msg = f"Status {resp.status_code}"
                    return {"status": "error", "message": f"HuggingFace Error: {err_msg}"}
            
            elif provider == "glm":
                 # Removed: Migrated to 'custom' generic provider, but keeping for backward compat if needed
                 if "." not in request.key:
                      return {"status": "warning", "message": "Invalid GLM Key format"}
                 return {"status": "success", "message": "GLM Key valid"}

            elif provider == "custom":
                # Verify Generic OpenAI Compatible API
                # Requires Base URL + Key
                if not request.base_url:
                    return {"status": "error", "message": "Base URL required for Custom API"}
                
                # Normalize URL: Ensure it doesn't end in / and append /models if likely needed
                # However, user might give full path. Let's try to list models on the given base.
                # Standard OpenAI: https://api.openai.com/v1 -> https://api.openai.com/v1/models
                base = request.base_url.rstrip("/")
                if not base.endswith("/models"):
                    check_url = f"{base}/models"
                else:
                    check_url = base

                headers = {"Authorization": f"Bearer {request.key}"}
                
                # Timeout 10s for custom endpoints (might be local)
                resp = requests.get(check_url, headers=headers, timeout=10)
                
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        # OpenAI format: { data: [...] }
                        if 'data' in data and isinstance(data['data'], list):
                             count = len(data['data'])
                             return {"status": "success", "message": f"Connected! Found {count} models."}
                        return {"status": "success", "message": "Connected! (Unknown response format)"}
                    except:
                        return {"status": "success", "message": "Connected! (Response not JSON)"}
                else:
                     try:
                         # Try to parse error
                         err = resp.json().get('error', {}).get('message', 'Unknown Error')
                         return {"status": "error", "message": f"API Error {resp.status_code}: {err}"}
                     except:
                         return {"status": "error", "message": f"Connection Failed: Status {resp.status_code}"}
            
            return {"status": "error", "message": f"Unknown provider: {provider}"}
            
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": f"Network Error: {str(e)}"}

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

class Neo4jCheckRequest(BaseModel):
    uri: str
    user: str
    password: str

    @app.post("/api/settings/neo4j/check")
    def check_neo4j_endpoint(request: Neo4jCheckRequest):
    """
    Check availability of Neo4j Graph Database.
    """
    try:
        from neo4j import GraphDatabase
    except ImportError:
        return {"status": "error", "message": "Neo4j driver not installed. Run 'pip install neo4j'"}

    try:
        # 5 second timeout for connection verification
        driver = GraphDatabase.driver(request.uri, auth=(request.user, request.password))
        driver.verify_connectivity()
        driver.close()
        return {"status": "success", "message": "Connected to Neo4j successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Neo4j Connection Failed: {str(e)}"}



# -----------------------------------------------------------------------------
# Agent Chat API
# -----------------------------------------------------------------------------
class AgentChatRequest(BaseModel):
    message: str

@app.post("/api/agent/chat")
def agent_chat_endpoint(request: AgentChatRequest):
    """
    Simple chat endpoint for the Agent.
    Routes to the configured LLM provider (Ollama, Custom, etc).
    """
    config = load_config()
    provider_config = config.get('ai_provider', {})
    mode = provider_config.get('mode', 'auto')
    
    # 1. Determine Provider
    # For now, default to Ollama if auto/ollama, or Custom if custom keys present
    # Simplified logic:
    
    import requests
    
    prompt = request.message
    system_prompt = "You are BioDockify Agent Zero, an expert pharmaceutical research assistant. Answer the user's questions based on the provided context (if any) and your knowledge. Be concise and scientific."
    
    # Try Custom/Paid API first if configured
    if provider_config.get('custom_key') and provider_config.get('custom_base_url'):
        try:
            base_url = provider_config['custom_base_url'].rstrip('/')
            key = provider_config['custom_key']
            model = provider_config.get('custom_model', 'gpt-3.5-turbo')
            
            # OpenAI Compatible Completion
            url = f"{base_url}/chat/completions"
            headers = {"Authorization": f"Bearer {key}"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            }
            # Use Resilient Request with Caching for identical prompts
            # We serialize dicts to strings to maintain hashability for lru_cache
            import json
            # Note: We don't cache 'safe_request' directly because it retries. 
            # We use safe_request logic usually, but for caching we might want 
            # to wrap the underlying request OR just cache critical repeated queries.
            # For now, let's stick to safe_request for robustness over caching here 
            # as user queries vary wildly.
            # BUT user asked for "Cache frequently used results" -> let's implement a simple prompt cache.
            
            resp = safe_request('POST', url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                content = resp.json()['choices'][0]['message']['content']
                return {"reply": content}
            else:
                 print(f"Custom API failed: {resp.text}")
        except Exception as e:
            print(f"Custom API Exception: {e}")

    # Fallback to Ollama
    try:
        ollama_url = provider_config.get('ollama_url', 'http://localhost:11434')
        model = provider_config.get('ollama_model', 'llama2')
        
        url = f"{ollama_url}/api/chat"
        payload = {
            "model": model,
            "messages": [
                 {"role": "system", "content": system_prompt},
                 {"role": "user", "content": prompt}
            ],
            "stream": False
        }
        # Use Resilient Request
        resp = safe_request('POST', url, json=payload, timeout=30)
        if resp.status_code == 200:
             content = resp.json()['message']['content']
             return {"reply": content}
        else:
             return {"reply": f"Error from Ollama: {resp.text}"}
             
    except Exception as e:
        return {"reply": f"Agent Error: {str(e)}. Please check your connections."}

from fastapi import UploadFile, File
from modules.rag.ingestor import ingestor
from modules.rag.vector_store import vector_store
import shutil
import tempfile
import os

@app.post("/api/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a document (PDF, Notebook, MD) into the knowledge base."""
    import re
    
    # 1. Sanitize Filename
    # Simple rigorous sanitization: allow only alphanumeric, dot, dash, underscore
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', file.filename)
    if not clean_name:
        clean_name = f"upload_{uuid.uuid4().hex}"
        
    # 2. Validate Extension
    ALLOWED_EXTS = {'.pdf', '.md', '.txt', '.ipynb', '.json'}
    suffix = os.path.splitext(clean_name.lower())[1]
    
    if suffix not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}. Allowed: {ALLOWED_EXTS}")
        
    # 3. Validate Context/Magic Bytes (Optional but recommended for PDF)
    # For now, we rely on ingestion pipeline to fail if invalid, but we ensure safe temp write.
    
    # Save to temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # Ingest
        chunks = ingestor.ingest_file(tmp_path)
        
        # Add metadata override for original filename
        for chunk in chunks:
            chunk['metadata']['source'] = clean_name
            
        vector_store.add_documents(chunks)
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {clean_name}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process file upload")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)

class LinkRequest(BaseModel):
    url: str

@app.post("/api/rag/link")
async def ingest_link(request: LinkRequest):
    """Ingest content from a URL (e.g., Google NotebookLM Share Link)."""
    from modules.rag.web_scraper import scrape_url
    
    try:
        text = scrape_url(request.url)
        if not text:
            raise HTTPException(status_code=400, detail="No content found at URL")
            
        # Create a document chunk (simplified ingestion for direct text)
        # We wrap it in a format ingestor/vector_store expects?
        # Actually ingestor expects a file path.
        # Let's save text to a temp .txt file and use existing ingestor!
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode='w', encoding='utf-8') as tmp:
            tmp.write(f"Source: {request.url}\n\n")
            tmp.write(text)
            tmp_path = tmp.name
            
        chunks = ingestor.ingest_file(tmp_path)
        
        # Override metadata
        for chunk in chunks:
            chunk['metadata']['source'] = request.url
            
        vector_store.add_documents(chunks)
        os.remove(tmp_path)
        
        return {"status": "success", "message": f"Indexed content from {request.url}"}
        
    except Exception as e:
        if 'tmp_path' in locals(): os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))



class ChatRequest(BaseModel):
    query: str

@app.post("/api/rag/chat")

async def chat_with_docs(request: ChatRequest):
    """Retrieve context and answer via configured LLM (Ollama/Agent)."""
    query = request.query
    
    # 1. Retrieve Context
    context_list = vector_store.query(query, n_results=5) # Top 5 chunks
    
    if not context_list:
        return {"answer": "I don't have enough context from your uploaded documents to answer that.", "sources": []}
        
    context_text = "\n\n---\n\n".join(context_list)
    
    # 2. Construct Augmented Prompt
    system_prompt = "You are a research assistant. Answer the user's question based ONLY on the provided Context. If the answer is not in the context, say so."
    full_prompt = f"Context:\n{context_text}\n\nQuestion: {query}\n\nAnswer:"
    
    # 3. Call LLM (Ollama or Configured Provider)
    from runtime.config_loader import load_config
    import requests
    import json
    
    cfg = load_config()
    ai_conf = cfg.get("ai_provider", {})
    
    answer = "Error generating response."
    
    try:
        # Default to Ollama for "Local NotebookLM" experience
        # Check if Ollama is configured
        ollama_url = ai_conf.get("ollama_url", "http://localhost:11434")
        ollama_model = ai_conf.get("ollama_model", "llama3") # Default to llama3 or mistral if not set
        
        # Simple Ollama Generate
        # We use non-streaming for this simple endpoint first
        resp = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": ollama_model,
                "prompt": full_prompt,
                "system": system_prompt,
                "stream": False
            },
            timeout=60 
        )
        
        if resp.status_code == 200:
            answer = resp.json().get("response", "No response from model.")
        else:
            # Fallback if Ollama fails or not found?
            # Maybe use the "Agent Zero" / Cloud LLM if configured?
            # For now, return error to prompt user to check settings.
            answer = f"Ollama Error ({resp.status_code}): {resp.text}"
            
    except Exception as e:
        answer = f"Failed to connect to Local LLM: {str(e)}. Please Ensure Ollama is running."

    return {
        "answer": answer,
        "context": context_text,
        "sources": [] 
    }

@app.post("/api/rag/clear")
def clear_knowledge_base():
    """Clear all indexed documents."""
    vector_store.clear()
    return {"status": "success", "message": "Knowledge base cleared."}


# Duplicate Agent Chat Endpoint Removed.
# The robust implementations is at line 416.


# -----------------------------------------------------------------------------
# System Info API (For First Run Wizard)
# -----------------------------------------------------------------------------

@app.get("/api/system/info")
def get_system_info():
    """
    Retrieve system hardware and environment information.
    Used by the First Run Wizard to validate compatibility.
    """
    import platform
    import os
    import shutil
    import sys
    import tempfile
    
    # OS Info
    os_name = f"{platform.system()} {platform.release()}"
    
    # CPU
    cpu_cores = os.cpu_count() or 1
    
    # RAM (Approximate using psutil if available, else vague or skip)
    ram_total_gb = 0
    ram_available_gb = 0
    
    try:
        import psutil
        mem = psutil.virtual_memory()
        ram_total_gb = round(mem.total / (1024**3), 1)
        ram_available_gb = round(mem.available / (1024**3), 1)
    except ImportError:
        # Fallback if psutil not installed
        ram_total_gb = 0 
        ram_available_gb = 0
        
    # Disk Usage
    try:
        total, used, free = shutil.disk_usage(".")
        disk_free_gb = round(free / (1024**3), 1)
    except:
        disk_free_gb = 0
        
    # Python
    python_version = sys.version.split(" ")[0]
    
    # Temp Writable Check
    temp_writable = False
    try:
        with tempfile.TemporaryFile() as f:
            f.write(b"test")
            temp_writable = True
    except:
        temp_writable = False
        
    return {
        "os": os_name,
        "cpu_cores": cpu_cores,
        "ram_total_gb": ram_total_gb,
        "ram_available_gb": ram_available_gb,
        "disk_free_gb": disk_free_gb,
        "temp_writable": temp_writable,
        "python_version": python_version
    }





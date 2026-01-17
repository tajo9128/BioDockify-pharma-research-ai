"""
BioDockify API Backend
FastAPI service exposing research capabilities to the UI.
"""

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid

# Import Core Systems
from orchestration.planner.orchestrator import ResearchOrchestrator, OrchestratorConfig
from orchestration.executor import ResearchExecutor
from modules.analyst.analytics_engine import ResearchAnalyst
from modules.backup import DriveClient, BackupManager

app = FastAPI(title="BioDockify - Pharma Research AI", version="2.16.3")

from fastapi.middleware.cors import CORSMiddleware

# CORS Configuration - Whitelist specific origins for security
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8234",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8234",
    "tauri://localhost",  # Tauri desktop app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
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

import json  # logging and time already imported above

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
        from modules.rag.vector_store import get_vector_store
        # Trigger model load by accessing the singleton
        vs = get_vector_store()
        # Initialize dependencies if lazy loaded
        if vs.model is None:
             vs._load_dependencies()
        if vs.model:
             vs.model.encode(["warmup"])
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
             try:
                 svc_mgr.start_ollama()
             except Exception as e:
                 logger.warning(f"Failed to start Local AI (Ollama): {e}")
                 logger.info("System will attempt to fallback to Cloud APIs if keys are available.")
                 # We do NOT raise exception here to keep backend alive
             
        # Check SurfSense (Replaces Neo4j)
        svc_mgr.start_surfsense()

    # 4. Start Background Monitoring Loop
    asyncio.create_task(background_monitor())

    # 4. Check for high memory usage warning
    if mem.percent > 90:
        logger.warning(f"High Memory Usage on Startup: {mem.percent}%")



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
# V2 AGENT ENDPOINTS (Phase 16)
# -----------------------------------------------------------------------------

class AgentGoal(BaseModel):
    goal: str
    mode: str = "auto" # auto, semi-autonomous, autonomous

# Thread-safe state manager for Agent V2
from threading import Lock

class AgentStateManager:
    """Thread-safe state manager for agent operations."""
    def __init__(self):
        self._state = {
            "status": "idle",
            "current_thought": "Waiting for user input...",
            "logs": [],
            "current_task_id": None
        }
        self._lock = Lock()
    
    def update(self, **kwargs):
        with self._lock:
            self._state.update(kwargs)
    
    def get(self, key: str, default=None):
        with self._lock:
            return self._state.get(key, default)
    
    def get_all(self) -> dict:
        with self._lock:
            return self._state.copy()
    
    def reset(self, task_id: str = None):
        with self._lock:
            self._state = {
                "status": "idle",
                "current_thought": "Waiting for user input...",
                "logs": [],
                "current_task_id": task_id
            }
    
    def append_log(self, log: str):
        with self._lock:
            self._state["logs"].append(log)

agent_state = AgentStateManager()

@app.post("/api/v2/agent/goal")
async def set_agent_goal(request: AgentGoal, background_tasks: BackgroundTasks):
    """
    V2: Set a high-level goal for Agent Zero.
    Triggers the Orchestrator in the background.
    """
    logger.info(f"Received Agent Goal: {request.goal} [Mode: {request.mode}]")
    
    # Pre-flight check: Verify LLM provider is available
    try:
        from runtime.config_loader import load_config
        from runtime.service_manager import get_service_manager
        
        cfg = load_config()
        ai_mode = cfg.get("ai_provider", {}).get("mode", "auto")
        
        # If using Ollama, verify it's running before starting task
        if ai_mode == "ollama":
            svc_mgr = get_service_manager(cfg)
            if svc_mgr.check_health("ollama") != "running":
                # Try to start Ollama automatically
                logger.warning("Ollama not running. Attempting to start...")
                if not svc_mgr.start_ollama():
                    raise HTTPException(
                        status_code=503,
                        detail="Ollama service is not running and could not be started. Please start Ollama with 'ollama serve' or configure a cloud API in Settings."
                    )
                logger.info("Ollama started successfully.")
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Pre-flight check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to verify AI provider: {str(e)}"
        )
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Reset State with task ID
    agent_state.reset(task_id)
    agent_state.update(status="thinking", current_thought="Analyzing research goal...")
    agent_state.append_log(f"Goal received: {request.goal}")
    
    # Define Background Task wrapper
    def run_agent_task(goal: str, mode: str):
        try:
            from runtime.config_loader import load_config
            cfg = load_config()
            
            # Initialize Orchestrator
            orch = ResearchOrchestrator()
            agent_state.update(current_thought="Planning research steps...")
            agent_state.append_log("Orchestrator initialized.")
            
            # Map agent mode to research planning mode
            # Frontend sends: auto, semi-autonomous, autonomous
            # Orchestrator expects: search, synthesize, write
            planning_mode = "synthesize"  # Default
            if mode in ["auto", "semi-autonomous", "autonomous"]:
                # For now, all autonomous modes use synthesize
                # Could be enhanced later to map to different modes based on complexity
                planning_mode = "synthesize"
            
            # Plan
            plan = orch.plan_research(goal, mode=planning_mode)
            if plan is None:
                raise ValueError("LLM failed to generate a plan. Check AI provider configuration.")
            
            agent_state.append_log(f"Plan generated: {len(plan.steps)} steps.")
            agent_state.update(
                current_thought=f"Plan created with {len(plan.steps)} steps. Ready to execute.",
                status="ready"
            )
            
        except ValueError as e:
            # LLM-specific errors
            logger.error(f"LLM Error: {e}")
            agent_state.update(status="error", current_thought=f"LLM Error: {str(e)}")
            agent_state.append_log(f"LLM Error: {str(e)}")
        except Exception as e:
            logger.error(f"Agent Task Failed: {e}")
            agent_state.update(status="error", current_thought=f"Error: {str(e)}")
            agent_state.append_log(f"Error: {str(e)}")

    # Launch Background Task
    background_tasks.add_task(run_agent_task, request.goal, request.mode)
    
    return {"status": "accepted", "message": "Agent started", "task_id": task_id, "ai_mode": ai_mode}



@app.get("/api/v2/agent/thinking")
def get_agent_thinking():
    """
    V2: Get current agent thought process (Streaming-like UI).
    """
    state = agent_state.get_all()
    logs = state.get("logs", [])
    return {
        "status": state.get("status", "idle"),
        "thought": state.get("current_thought", ""),
        "task_id": state.get("current_task_id"),
        "logs": logs[-5:] if logs else []  # Return last 5 logs
    }

# -----------------------------------------------------------------------------
# V2 SYSTEM HEALTH ENDPOINTS (Phase 19)
# -----------------------------------------------------------------------------
from modules.system.doctor import SystemDoctor

@app.get("/api/v2/system/diagnose")
def diagnose_system():
    """
    V2: Run a full system diagnostic and return a health report.
    """
    from runtime.config_loader import load_config
    cfg = load_config()
    
    doctor = SystemDoctor(cfg)
    report = doctor.run_diagnosis()
    return report

@app.post("/api/v2/system/repair")
def repair_system(service: str = "ollama"):
    """
    V2: Attempt to repair a specific system service.
    """
    from runtime.config_loader import load_config
    from runtime.service_manager import get_service_manager
    
    cfg = load_config()
    svc_mgr = get_service_manager(cfg)
    
    try:
        result = svc_mgr.attempt_repair(service)
        return result
    except AttributeError:
        # Fallback if attempt_repair doesn't exist
        if service == "ollama":
            success = svc_mgr.start_ollama()
            return {
                "status": "success" if success else "failed",
                "service": service,
                "message": "Ollama started" if success else "Failed to start Ollama"
            }
        return {"status": "error", "message": f"Unknown service: {service}"}

# -----------------------------------------------------------------------------
# DIGITAL LIBRARY ENDPOINTS (Phase 5)
# -----------------------------------------------------------------------------
from fastapi import UploadFile, File, Form
from modules.library.store import library_store
from modules.library.ingestor import library_ingestor

# -----------------------------------------------------------------------------
# KNOWLEDGE BASE & PODCAST ENDPOINTS (Phase 33)
# -----------------------------------------------------------------------------

class PodcastRequest(BaseModel):
    text: str
    voice: str = "alloy"  # OpenAI TTS voice

class KnowledgeQueryRequest(BaseModel):
    query: str
    top_k: int = 5

@app.post("/api/knowledge/query")
async def query_knowledge_base(request: KnowledgeQueryRequest):
    """
    Query the internal knowledge base (RAG) and return cited results.
    Used by Agent Zero and the Knowledge Hub UI.
    """
    try:
        from modules.rag.vector_store import get_vector_store
        store = get_vector_store()
        results = store.search(request.query, k=request.top_k)
        return {
            "status": "success",
            "query": request.query,
            "results": [
                {
                    "text": r.get("text", ""),
                    "score": r.get("score", 0),
                    "metadata": r.get("metadata", {})
                }
                for r in results
            ]
        }
    except Exception as e:
        logger.error(f"Knowledge query failed: {e}")
        return {"status": "error", "error": str(e), "results": []}

@app.post("/api/knowledge/podcast")
async def generate_podcast(request: PodcastRequest):
    """
    Generate a podcast audio from text using TTS.
    Supports OpenAI TTS or local Kokoro TTS.
    """
    try:
        from runtime.config_loader import load_config
        cfg = load_config()
        
        # Try OpenAI TTS first if key is available
        custom_key = cfg.get("ai_provider", {}).get("custom_key")
        custom_base_url = cfg.get("ai_provider", {}).get("custom_base_url", "https://api.openai.com/v1")
        
        if custom_key:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{custom_base_url}/audio/speech",
                    headers={"Authorization": f"Bearer {custom_key}"},
                    json={
                        "model": "tts-1",
                        "input": request.text[:4096],  # Limit to 4096 chars
                        "voice": request.voice
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    # Return audio as base64
                    import base64
                    audio_b64 = base64.b64encode(response.content).decode('utf-8')
                    return {
                        "status": "success",
                        "audio_format": "mp3",
                        "audio_base64": audio_b64
                    }
                else:
                    return {"status": "error", "error": f"TTS API returned {response.status_code}"}
        else:
            return {"status": "error", "error": "No TTS API key configured. Please add an OpenAI-compatible API key in Settings."}
            
    except Exception as e:
        logger.error(f"Podcast generation failed: {e}")
        return {"status": "error", "error": str(e)}

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

# File upload security constants
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.docx', '.csv', '.xlsx', '.md', '.json', '.ipynb'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@app.post("/api/library/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a file to the internal Knowledge Base.
    Stores file locally AND indexes into vector store for semantic search.
    """
    try:
        from modules.rag.ingestor import ingestor
        from modules.rag.vector_store import get_vector_store
        import os
        
        # Validate file extension
        _, ext = os.path.splitext(file.filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read and validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # 2. Store Locally (for UI listing and file retrieval)
        record = library_store.add_file(content, file.filename)
        file_path = library_store.get_file_path(record['id'])
        
        # 3. Ingest and Index into Vector Store
        vector_status = "pending"
        chunk_count = 0
        try:
            chunks = ingestor.ingest_file(str(file_path))
            if chunks:
                get_vector_store().add_documents(chunks)
                chunk_count = len(chunks)
                vector_status = "indexed"
                # Mark file as processed
                library_store.update_metadata(record['id'], {
                    "processed": True,
                    "chunk_count": chunk_count
                })
        except Exception as e:
            logger.warning(f"Vector indexing failed for {file.filename}: {e}")
            vector_status = "failed"
            library_store.update_metadata(record['id'], {
                "processed": False,
                "index_error": str(e)
            })

        return {
            "status": "success", 
            "file": record, 
            "vector_index": vector_status,
            "chunks_indexed": chunk_count
        }
        
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
         # Graceful fallback if RAG is offline
         logger.warning(f"RAG Search failed: {e}")
         return {"results": []}

# -----------------------------------------------------------------------------
# OMNI-TOOLS NATIVE ENDPOINTS
# -----------------------------------------------------------------------------
from fastapi.responses import StreamingResponse
import io

@app.post("/api/tools/pdf/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merges multiple PDFs into one."""
    try:
        from modules.tools_native.processor import tool_processor
        file_contents = []
        for f in files:
            file_contents.append(await f.read())
            
        merged_pdf = tool_processor.merge_pdfs(file_contents)
        
        return StreamingResponse(
            io.BytesIO(merged_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=merged.pdf"}
        )
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/image/convert")
async def convert_image(file: UploadFile = File(...), format: str = Form(...)):
    """Converts image to target format."""
    try:
        from modules.tools_native.processor import tool_processor
        content = await file.read()
        converted = tool_processor.convert_image(content, format)
        
        mime_map = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}
        mime = mime_map.get(format.lower(), "application/octet-stream")
        
        return StreamingResponse(
            io.BytesIO(converted),
            media_type=mime,
            headers={"Content-Disposition": f"attachment; filename=converted.{format.lower()}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/data/process")
async def process_data(file: UploadFile = File(...), operation: str = Form(...)):
    """Processes data files (CSV/JSON/Excel)."""
    try:
        from modules.tools_native.processor import tool_processor
        content = await file.read()
        # Returns string (JSON/CSV)
        result = tool_processor.process_data(content, file.filename, operation)
        
        # Determine media type
        if operation == "to_csv":
            media = "text/csv"
            ext = "csv"
        else:
            media = "application/json"
            ext = "json"
            
        return StreamingResponse(
            io.BytesIO(result.encode('utf-8')),
            media_type=media,
            headers={"Content-Disposition": f"attachment; filename=result.{ext}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    client_ip = request.client.host if request.client else "testclient"
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
            "client_ip": request.client.host if request.client else "testclient",
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
    model: Optional[str] = None # For custom provider strict validation

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
                
                base = request.base_url.rstrip("/")
                headers = {"Authorization": f"Bearer {request.key}", "Content-Type": "application/json"}
                
                # Method 1: Try /models endpoint (works for OpenAI, Groq, etc.)
                try:
                    models_url = f"{base}/models"
                    resp = requests.get(models_url, headers=headers, timeout=5)
                    if resp.status_code == 200:
                        try:
                            data = resp.json()
                            if 'data' in data and isinstance(data['data'], list):
                                count = len(data['data'])
                                return {"status": "success", "message": f"Connected! Found {count} models."}
                            return {"status": "success", "message": "Connected! (via /models)"}
                        except:
                            return {"status": "success", "message": "Connected!"}
                except:
                    pass  # Fall through to Method 2
                
                # Method 2: Try a minimal chat completion (works for GLM, custom endpoints)
                try:
                    chat_url = f"{base}/chat/completions"
                    # Use provided model or fallback to strict GPT-3.5-turbo (which might fail on others)
                    # Ideally, for "Test", we should use a model user specified.
                    test_model = request.model if request.model else "gpt-3.5-turbo"
                    
                    payload = {
                        "model": test_model, 
                        "messages": [{"role": "user", "content": "hi"}],
                        "max_tokens": 5
                    }
                    resp = requests.post(chat_url, headers=headers, json=payload, timeout=10)
                    
                    if resp.status_code == 200:
                        return {"status": "success", "message": "Custom API Connected! (via chat test)"}
                    elif resp.status_code == 401:
                        return {"status": "error", "message": "Invalid API Key (401 Unauthorized)"}
                    elif resp.status_code == 403:
                        return {"status": "error", "message": "Access Denied (403 Forbidden)"}
                    elif resp.status_code == 404:
                        return {"status": "error", "message": f"Endpoint not found. Check Base URL."}
                    else:
                        try:
                            err = resp.json().get('error', {}).get('message', f'Status {resp.status_code}')
                            return {"status": "error", "message": f"API Error: {err}"}
                        except:
                            return {"status": "error", "message": f"Connection Failed: Status {resp.status_code}"}
                except requests.exceptions.ConnectionError:
                    return {"status": "error", "message": f"Cannot connect to {base}. Is the server running?"}
                except requests.exceptions.Timeout:
                    return {"status": "error", "message": "Connection timed out. Server may be slow."}
                except Exception as e:
                    return {"status": "error", "message": f"Test failed: {str(e)}"}
            
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






# -----------------------------------------------------------------------------
# SurfSense Integration Endpoints
# -----------------------------------------------------------------------------

class SurfSenseCheckRequest(BaseModel):
    base_url: str = "http://localhost:8000"

@app.post("/api/surfsense/check")
async def check_surfsense(request: SurfSenseCheckRequest):
    """Check if SurfSense is running and healthy."""
    from modules.surfsense import get_surfsense_client
    
    client = get_surfsense_client(request.base_url)
    is_healthy = await client.health_check()
    
    if is_healthy:
        return {"status": "success", "message": "SurfSense is running"}
    else:
        return {"status": "error", "message": "SurfSense is not reachable"}

class PodcastRequest(BaseModel):
    chat_id: str
    voice: str = "alloy"  # OpenAI voices: alloy, echo, fable, onyx, nova, shimmer

@app.post("/api/surfsense/podcast")
async def generate_podcast(request: PodcastRequest):
    """Generate audio podcast from a chat conversation via SurfSense."""
    from modules.surfsense import get_surfsense_client
    from runtime.config_loader import load_config
    
    config = load_config()
    surfsense_url = config.get('ai_provider', {}).get('surfsense_url', 'http://localhost:8000')
    
    client = get_surfsense_client(surfsense_url)
    
    if not await client.health_check():
        raise HTTPException(status_code=503, detail="SurfSense is not running")
    
    result = await client.generate_podcast(request.chat_id, request.voice)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result

class SurfSenseSearchRequest(BaseModel):
    query: str
    top_k: int = 5

@app.post("/api/surfsense/search")
async def surfsense_search(request: SurfSenseSearchRequest):
    """Search SurfSense knowledge base directly."""
    from modules.surfsense import get_surfsense_client
    from runtime.config_loader import load_config
    
    config = load_config()
    surfsense_url = config.get('ai_provider', {}).get('surfsense_url', 'http://localhost:8000')
    
    client = get_surfsense_client(surfsense_url)
    
    if not await client.health_check():
        return {"results": [], "source": "offline"}
    
    results = await client.search(request.query, top_k=request.top_k)
    return {"results": results, "source": "surfsense"}

# -----------------------------------------------------------------------------
# AGENT ZERO: Central Brain with Full Software Control
# -----------------------------------------------------------------------------

# Agent Zero Constitution & Roles
AGENT_ZERO_CONSTITUTION = """
## IDENTITY
You are Agent Zero, the central intelligence of BioDockify - a pharmaceutical research platform.

## CONSTITUTION (Core Principles)
1. ACCURACY: Provide scientifically accurate, evidence-based information
2. SAFETY: Never provide dangerous drug synthesis or harmful advice
3. TRANSPARENCY: Always cite sources and acknowledge uncertainty
4. EFFICIENCY: Choose the optimal tool for each task
5. PRIVACY: Never share user data outside the system
6. AUTONOMY: You are responsible for your own maintenance and configuration.

## ROLES (You can fulfill all these roles)
- RESEARCHER: Search literature, find papers, summarize findings
- ANALYST: Perform statistical analysis on data
- LIBRARIAN: Manage knowledge base, index documents, retrieve information
- AUDITOR: Verify journal legitimacy, detect predatory publishers
- ASSISTANT: Answer questions, explain concepts, help with workflows
- SYSTEM_ADMIN: Self-diagnose, update settings, and manage background services.

## AVAILABLE ACTIONS (Use when appropriate)
- [ACTION: research | query=<topic>] - Search PubMed/literature
- [ACTION: search_kb | query=<topic>] - Search user's knowledge base
- [ACTION: verify_journal | issn=<issn>, title=<name>] - Check journal legitimacy
- [ACTION: analyze_stats | data=<json>, design=<type>] - Statistical analysis
- [ACTION: podcast | text=<content>] - Generate audio podcast
- [ACTION: web_search | query=<topic>] - Search the web
- [ACTION: deep_research | url=<url>] - Deep research visiting the page (autonomously extracts content)
- [ACTION: check_health] - Run system diagnostics (Doctor)
- [ACTION: update_settings | section=<name>, key=<name>, value=<value>] - Edit configuration
- [ACTION: restart_service | service=<name>] - Restart Ollama/SurfSense

## OPERATING MODES
1. CHAT (Default): Answer questions, provide guidance
2. SEMI-AUTONOMOUS: Execute actions when user requests
3. AUTONOMOUS: Proactively complete complex multi-step tasks

## SELF-HEALING & MAINTENANCE
- If a tool fails, analyze the error and try a different approach.
- If an API Key is missing or invalid, ask the user to provide it OR update it yourself if provided in chat.
- Periodically check your own health using [ACTION: check_health].

## RESPONSE FORMAT
- For simple questions: Just answer
- For actions: Include [ACTION: ...] tags
- For multi-step: Break down and explain each step
"""

class AgentExecuteRequest(BaseModel):
    action: str  # "research", "search_kb", "verify_journal", "analyze_stats", "podcast", "web_search", "check_health", "update_settings", "restart_service"
    params: Dict[str, Any] = {}

@app.post("/api/agent/execute")
async def agent_execute(request: AgentExecuteRequest):
    """
    Universal Agent Zero execution endpoint.
    Allows Agent Zero (or direct API calls) to invoke any software function.
    """
    action = request.action.lower()
    params = request.params
    
    try:
        # RESEARCH: Search literature
        if action == "research":
            query = params.get("query", "")
            from modules.literature import search_pubmed
            results = search_pubmed(query, max_results=10)
            return {"status": "success", "action": "research", "results": results}
        
        # SEARCH_KB: Search knowledge base
        elif action == "search_kb":
            query = params.get("query", "")
            from modules.rag.vector_store import get_vector_store
            vs = get_vector_store()
            results = vs.search(query, k=5)
            return {"status": "success", "action": "search_kb", "results": results}
        
        # VERIFY_JOURNAL: Check journal legitimacy
        elif action == "verify_journal":
            issn = params.get("issn", "")
            title = params.get("title", "")
            url = params.get("url")
            from modules.journal_intel import DecisionEngine
            engine = DecisionEngine()
            result = engine.verify(issn=issn, title=title, url=url)
            return {
                "status": "success", 
                "action": "verify_journal",
                "decision": result.decision,
                "confidence": result.confidence_level,
                "risk_factors": result.risk_factors
            }
        
        # ANALYZE_STATS: Run statistical analysis
        elif action == "analyze_stats":
            data = params.get("data", [])
            design = params.get("design", "descriptive")
            tier = params.get("tier", "basic")
            from modules.statistics.engine import StatisticalEngine
            engine = StatisticalEngine()
            result = engine.analyze(data, design=design, tier=tier)
            return {"status": "success", "action": "analyze_stats", "result": result}
        
        # PODCAST: Generate audio (via SurfSense)
        elif action == "podcast":
            text = params.get("text", "")
            chat_id = params.get("chat_id", "")
            from modules.surfsense import get_surfsense_client
            client = get_surfsense_client()
            if await client.health_check():
                result = await client.generate_podcast(chat_id)
                return {"status": "success", "action": "podcast", "result": result}
            return {"status": "error", "action": "podcast", "error": "SurfSense offline"}
        
        # WEB_SEARCH: Search the web (via SurfSense/Tavily)
        elif action == "web_search":
            query = params.get("query", "")
            from modules.surfsense import get_surfsense_client
            client = get_surfsense_client()
            if await client.health_check():
                results = await client.search(query)
                return {"status": "success", "action": "web_search", "results": results}
            return {"status": "error", "action": "web_search", "error": "SurfSense offline"}

        # CHECK_HEALTH: Run system diagnostics
        elif action == "check_health":
            from modules.system.doctor import SystemDoctor
            doctor = SystemDoctor()
            report = doctor.diagnose()
            return {"status": "success", "action": "check_health", "report": report}

        # UPDATE_SETTINGS: Reconfigure system
        elif action == "update_settings":
            section = params.get("section")
            key = params.get("key")
            value = params.get("value")
            
            if not section or not key:
                return {"status": "error", "message": "Section and Key required"}

            current_settings = load_config()
            
            # Navigate to section
            if section not in current_settings:
                return {"status": "error", "message": f"Section '{section}' not found"}
            
            # Update key
            current_settings[section][key] = value
            
            if save_config(current_settings):
                return {"status": "success", "action": "update_settings", "message": f"Updated {section}.{key} = {value}"}
            else:
                return {"status": "error", "message": "Failed to save settings"}

        # RESTART_SERVICE: Manage background services
        elif action == "restart_service":
            service = params.get("service")
            from runtime.service_manager import ServiceManager
            mgr = ServiceManager()
            if service == "ollama":
                mgr.restart_service("ollama")
            elif service == "surfsense":
                mgr.restart_service("surfsense")
            else:
                return {"status": "error", "message": "Unknown service"}
            return {"status": "success", "action": "restart_service", "message": f"Restarted {service}"}
        
        # DEEP_RESEARCH: Autonomous Headless Browsing
        elif action == "deep_research":
            url = params.get("url", "")
            from modules.headless_research import deep_research
            result = await deep_research(url)
            return {"status": "success", "action": "deep_research", "result": result}
            
        # DEEP_REVIEW: Full Autonomous Review Pipeline
        elif action == "deep_review":
            topic = params.get("topic", "")
            from modules.literature.orchestrator import orchestrator
            result = await orchestrator.run_deep_review(topic)
            return {"status": "success", "action": "deep_review", "result": result}
        
        else:
            return {"status": "error", "error": f"Unknown action: {action}"}
            
    except Exception as e:
        logger.error(f"Agent Execute Error: {e}")
        return {"status": "error", "action": action, "error": str(e)}


# -----------------------------------------------------------------------------
# Agent Chat API (with multi-mode support)
# -----------------------------------------------------------------------------
class AgentChatRequest(BaseModel):
    message: str
    mode: str = "chat"  # "chat", "semi-autonomous", "autonomous"

@app.post("/api/agent/chat")
def agent_chat_endpoint(request: AgentChatRequest):
    """
    Agent Zero Chat Endpoint with SurfSense + RAG Integration.
    1. Tries SurfSense first (if running) for advanced RAG
    2. Falls back to internal Knowledge Base
    3. Routes to configured LLM provider
    """
    import requests as req
    import asyncio
    from modules.rag.vector_store import get_vector_store
    from modules.surfsense import get_surfsense_client
    
    config = load_config()
    provider_config = config.get('ai_provider', {})
    
    user_query = request.message
    
    # =========================================================================
    # STEP 1: Search SurfSense (Priority) then Internal KB (Fallback)
    # =========================================================================
    kb_context = ""
    kb_sources = []
    context_source = "none"
    
    # Try SurfSense first
    surfsense_url = provider_config.get('surfsense_url', 'http://localhost:8000')
    surfsense_client = get_surfsense_client(surfsense_url)
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Check if SurfSense is running
        if loop.run_until_complete(surfsense_client.health_check()):
            results = loop.run_until_complete(surfsense_client.search(user_query, top_k=3))
            if results:
                context_parts = []
                for r in results:
                    source = r.get('source', r.get('metadata', {}).get('source', 'SurfSense'))
                    text = r.get('text', r.get('content', ''))[:500]
                    context_parts.append(f"[Source: {source}]\n{text}")
                    kb_sources.append(source)
                kb_context = "\n\n---\n\n".join(context_parts)
                context_source = "surfsense"
        loop.close()
    except Exception as e:
        logger.warning(f"SurfSense search failed, falling back to internal KB: {e}")
    
    # Fallback to internal KB
    if not kb_context:
        try:
            vector_store = get_vector_store()
            results = vector_store.search(user_query, k=3)
            
            if results:
                context_parts = []
                for r in results:
                    source = r.get('metadata', {}).get('source', 'Unknown')
                    text = r.get('text', '')[:500]
                    context_parts.append(f"[Source: {source}]\n{text}")
                    kb_sources.append(source)
                kb_context = "\n\n---\n\n".join(context_parts)
                context_source = "internal_kb"
        except Exception as e:
            logger.warning(f"Internal KB search failed: {e}")
    
    # =========================================================================
    # STEP 2: Build Enhanced Prompt with KB Context and Constitution
    # =========================================================================
    # =========================================================================
    # =========================================================================
    # STEP 2: Build Enhanced Prompt with KB Context and Constitution
    # =========================================================================
    # Use the full Agent Zero Constitution as system prompt
    from modules.agent import AGENT_ZERO_SYSTEM_PROMPT, PHD_THESIS_WRITER_PROMPT, PHARMA_REVIEW_WRITER_PROMPT, PHARMA_RESEARCH_WRITER_PROMPT
    
    if request.mode == "thesis_writer":
        base_prompt = PHD_THESIS_WRITER_PROMPT
    elif request.mode == "review_writer":
        base_prompt = PHARMA_REVIEW_WRITER_PROMPT
    elif request.mode == "research_writer":
        base_prompt = PHARMA_RESEARCH_WRITER_PROMPT
    else:
        # Default to the Pharma Research / General Agent Zero prompt
        base_prompt = AGENT_ZERO_SYSTEM_PROMPT

    system_prompt = base_prompt + f"""

## CURRENT MODE: {request.mode.upper()}
## CONTEXT SOURCE: {context_source}
"""

    if kb_context:
        enhanced_prompt = f"""Use the following context from the Knowledge Base to answer the question:

---
KNOWLEDGE BASE CONTEXT:
{kb_context}
---

USER QUESTION: {user_query}

Provide a well-structured answer based on the context above. If the context doesn't contain relevant information, say so and provide general guidance."""
    else:
        enhanced_prompt = user_query
    
    errors = []  # Track all provider errors for debugging
    
    # =========================================================================
    # PROVIDER 1: Custom/Paid OpenAI-Compatible API (GLM, Groq, OpenAI, etc.)
    # =========================================================================
    if provider_config.get('custom_key') and provider_config.get('custom_base_url'):
        try:
            base_url = provider_config['custom_base_url'].rstrip('/')
            key = provider_config['custom_key']
            model = provider_config.get('custom_model', 'gpt-3.5-turbo')
            
            url = f"{base_url}/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_prompt}
                ]
            }
            
            resp = req.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                if content:
                    return {"reply": content, "provider": "custom"}
            errors.append(f"Custom API ({model}): {resp.status_code}")
        except Exception as e:
            errors.append(f"Custom API: {str(e)}")
    
    # =========================================================================
    # PROVIDER 2: Google Gemini
    # =========================================================================
    if provider_config.get('google_key'):
        try:
            key = provider_config['google_key']
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_prompt}\n\nUser: {enhanced_prompt}"}]}]
            }
            
            resp = req.post(url, json=payload, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                if content:
                    return {"reply": content, "provider": "google"}
            errors.append(f"Google Gemini: {resp.status_code}")
        except Exception as e:
            errors.append(f"Google Gemini: {str(e)}")
    
    # =========================================================================
    # PROVIDER 3: OpenRouter
    # =========================================================================
    if provider_config.get('openrouter_key'):
        try:
            key = provider_config['openrouter_key']
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "BioDockify",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "openai/gpt-3.5-turbo",  # Default free-tier model
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_prompt}
                ]
            }
            
            resp = req.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                content = resp.json().get('choices', [{}])[0].get('message', {}).get('content', '')
                if content:
                    return {"reply": content, "provider": "openrouter"}
            errors.append(f"OpenRouter: {resp.status_code}")
        except Exception as e:
            errors.append(f"OpenRouter: {str(e)}")
    
    # =========================================================================
    # PROVIDER 4: GLM (ZhipuAI) - Direct API
    # =========================================================================
    if provider_config.get('glm_key'):
        try:
            key = provider_config['glm_key']
            url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {
                "model": "glm-4",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": enhanced_prompt}
                ]
            }
            
            resp = req.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                content = resp.json().get('choices', [{}])[0].get('message', {}).get('content', '')
                if content:
                    return {"reply": content, "provider": "glm"}
            errors.append(f"GLM: {resp.status_code}")
        except Exception as e:
            errors.append(f"GLM: {str(e)}")
    
    # =========================================================================
    # PROVIDER 5: HuggingFace Inference API
    # =========================================================================
    if provider_config.get('huggingface_key'):
        try:
            key = provider_config['huggingface_key']
            url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1"
            headers = {"Authorization": f"Bearer {key}"}
            payload = {"inputs": f"<s>[INST] {system_prompt}\n\n{prompt} [/INST]"}
            
            resp = req.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and len(data) > 0:
                    content = data[0].get('generated_text', '')
                    # Extract response after [/INST]
                    if '[/INST]' in content:
                        content = content.split('[/INST]')[-1].strip()
                    if content:
                        return {"reply": content, "provider": "huggingface"}
            errors.append(f"HuggingFace: {resp.status_code}")
        except Exception as e:
            errors.append(f"HuggingFace: {str(e)}")
    
    # =========================================================================
    # PROVIDER 6: Ollama (Local, Final Fallback)
    # =========================================================================
    try:
        ollama_url = provider_config.get('ollama_url', 'http://localhost:11434')
        model = provider_config.get('ollama_model', 'llama2')
        
        url = f"{ollama_url}/api/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": enhanced_prompt}
            ],
            "stream": False
        }
        
        resp = req.post(url, json=payload, timeout=120)  # Longer timeout for local
        if resp.status_code == 200:
            content = resp.json().get('message', {}).get('content', '')
            if content:
                return {"reply": content, "provider": "ollama"}
        errors.append(f"Ollama ({model}): {resp.status_code}")
    except Exception as e:
        errors.append(f"Ollama: {str(e)}")
    
    # =========================================================================
    # ALL PROVIDERS FAILED
    # =========================================================================
    error_summary = "; ".join(errors) if errors else "No providers configured"
    return {
        "reply": f"⚠️ Agent Zero could not connect to any AI provider.\n\n**Attempted:** {error_summary}\n\n**Solution:** Please configure at least one provider in Settings (Ollama, Google, OpenRouter, or Custom API).",
        "provider": "none",
        "errors": errors
    }

from fastapi import UploadFile, File
from modules.rag.ingestor import ingestor
from modules.rag.vector_store import get_vector_store
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
            
        get_vector_store().add_documents(chunks)
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {clean_name}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process file upload")
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)


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
            
        get_vector_store().add_documents(chunks)
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
    vector_store = get_vector_store()
    results = vector_store.search(query, k=5) # Top 5 chunks
    context_list = [r['text'] for r in results]
    
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
    get_vector_store().clear()
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





# -----------------------------------------------------------------------------
# PHD THESIS CORE ENDPOINTS (Phase 7)
# -----------------------------------------------------------------------------
from modules.thesis.engine import thesis_engine
from modules.thesis.structure import THESIS_STRUCTURE

class ThesisRequest(BaseModel):
    chapter_id: str
    topic: str

@app.get("/api/thesis/structure")
def get_thesis_structure():
    """Return the strict 7-chapter structure definition."""
    # Convert Enum keys to string for JSON serialization
    return {k.value: v.dict() for k, v in THESIS_STRUCTURE.items()}

@app.get("/api/thesis/validate/{chapter_id}")
def validate_chapter(chapter_id: str):
    """Check if proofs exist for a chapter."""
    from modules.thesis.validator import thesis_validator
    return thesis_validator.validate_chapter_readiness(chapter_id)

@app.post("/api/thesis/generate")
async def generate_chapter_endpoint(req: ThesisRequest):
    """Generate a chapter draft if validation passes."""
    return await thesis_engine.generate_chapter(req.chapter_id, req.topic)

# -----------------------------------------------------------------------------
# Google Drive Backup System
# -----------------------------------------------------------------------------

# Initialize Backup System
drive_client = DriveClient(storage_path="./mock_cloud_storage")
backup_manager = BackupManager(drive_client)

class BackupAuthVerifyRequest(BaseModel):
    code: str

class RestoreRequest(BaseModel):
    snapshot_id: str

@app.post("/api/backup/auth/url")
def get_backup_auth_url():
    """Returns the URL to start the OAuth flow via BioDockify."""
    return {"url": drive_client.get_auth_url()}

@app.post("/api/backup/auth/verify")
def verify_backup_auth(req: BackupAuthVerifyRequest):
    """Verifies the auth code (simulated exchange)."""
    success = drive_client.authenticate(req.code)
    if success:
        return {"status": "success", "user": drive_client.get_user_info()}
    else:
        raise HTTPException(status_code=401, detail="Authentication failed")

@app.get("/api/backup/status")
def get_backup_status():
    """Returns connection status and user info."""
    return drive_client.get_user_info()

@app.post("/api/backup/run")
def run_backup(background_tasks: BackgroundTasks):
    """Triggers a backup in the background."""
    # Defers the actual backup to background task
    def _do_backup():
        # Backing up the adjacent 'brain' directory and 'ui/src' as example of critical data
        # In prod, this would be the user's workspace path
        target_dirs = ["./brain", "./ui/src/lib"] 
        result = backup_manager.create_backup(target_dirs)
        logger.info(f"Backup completed: {result}")
    
    background_tasks.add_task(_do_backup)
    return {"status": "started", "message": "Backup initiated in background"}

@app.get("/api/backup/history")
def get_backup_history():
    """Lists available snapshots."""
    return drive_client.list_backups()

@app.post("/api/backup/restore")
def restore_backup(req: RestoreRequest):
    """Restores a specific snapshot."""
    # Restoration path defaults to a safe 'restored' folder for safety in this demo
    target_path = "./restored_data"
    result = backup_manager.restore_backup(req.snapshot_id, target_path)
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result


# =============================================================================
# SLIDES GENERATION ENDPOINTS
# =============================================================================

class SlideRequest(BaseModel):
    """Request model for slide generation."""
    source: str  # "knowledge_base", "search", "prompt", "documents"
    topic: str = ""
    search_query: str = ""
    custom_prompt: str = ""
    document_ids: List[str] = []
    style: str = "academic"
    num_slides: int = 10
    include_citations: bool = True


@app.post("/api/slides/generate")
async def generate_slides(request: SlideRequest, background_tasks: BackgroundTasks):
    """
    Generate presentation slides from various Knowledge Base sources.
    
    Supports:
    - knowledge_base: Query KB by topic
    - search: Generate from search results
    - prompt: Custom user description
    - documents: Specific document IDs
    """
    try:
        from modules.slides.slide_generator import get_slide_generator
        from modules.rag.vector_store import get_vector_store
        from modules.llm.factory import LLMFactory
        from runtime.config_loader import load_config
        
        # Initialize dependencies
        cfg = load_config()
        rag = get_vector_store()
        
        # Get LLM adapter
        try:
            from orchestration.planner.orchestrator import OrchestratorConfig
            orch_config = OrchestratorConfig()
            provider = cfg.get("ai_provider", {}).get("mode", "auto")
            llm = LLMFactory.get_adapter(provider, orch_config)
        except:
            llm = None
        
        generator = get_slide_generator(llm, rag)
        
        # Generate based on source type
        if request.source == "knowledge_base":
            result = generator.generate_from_knowledge_base(
                topic=request.topic,
                style=request.style,
                num_slides=request.num_slides,
                include_citations=request.include_citations
            )
        elif request.source == "search":
            # First perform search
            search_results = rag.search(request.search_query, top_k=request.num_slides * 2)
            result = generator.generate_from_search(
                search_results=search_results,
                style=request.style,
                title=request.topic or "Research Findings"
            )
        elif request.source == "prompt":
            result = generator.generate_from_prompt(
                prompt=request.custom_prompt,
                style=request.style,
                num_slides=request.num_slides
            )
        elif request.source == "documents":
            result = generator.generate_from_documents(
                document_ids=request.document_ids,
                style=request.style,
                title=request.topic or "Document Summary"
            )
        else:
            raise HTTPException(status_code=400, detail=f"Invalid source: {request.source}")
        
        return result
        
    except Exception as e:
        logger.error(f"Slides generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/slides/styles")
def get_slide_styles():
    """Get available slide styles."""
    from modules.slides.slide_styles import SLIDE_STYLES
    return {
        "styles": [
            {"id": k, "name": v["name"], "description": v["description"]}
            for k, v in SLIDE_STYLES.items()
        ]
    }


@app.post("/api/slides/render")
async def render_slides_html(request: dict):
    """Render slides as HTML for preview or download."""
    try:
        from modules.slides.slide_styles import generate_presentation_html
        
        slides = request.get("slides", [])
        style = request.get("style", "academic")
        title = request.get("title", "Presentation")
        
        html = generate_presentation_html(slides, style, title)
        
        return {"status": "success", "html": html}
        
    except Exception as e:
        logger.error(f"Slides rendering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

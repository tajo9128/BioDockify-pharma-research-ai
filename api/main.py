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
        
        # 2. Execute
        # Pass task_id into executor for granular checkpointing
        executor = ResearchExecutor(task_id=task_id) 
        context = executor.execute_plan(plan)
        
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

        import requests
        provider = request.provider
        
        try:
            if provider == "google":
                # Verify with Google Generative Language API
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={request.key}"
                resp = requests.get(url, timeout=5)
                if resp.status_code == 200:
                    return {"status": "success", "message": "Google Gemini Key Verified"}
                else:
                    return {"status": "error", "message": f"Google API Error: {resp.status_code} - {resp.json().get('error', {}).get('message', 'Unknown')}"}
                 
            elif provider == "openrouter":
                # Verify with OpenRouter Auth API
                headers = {"Authorization": f"Bearer {request.key}"}
                resp = requests.get("https://openrouter.ai/api/v1/auth/key", headers=headers, timeout=5)
                if resp.status_code == 200:
                     return {"status": "success", "message": "OpenRouter Key Verified"}
                else:
                     return {"status": "error", "message": "Invalid OpenRouter Key"}
           
            elif provider == "huggingface":
                # Verify with HF WhoAmI
                headers = {"Authorization": f"Bearer {request.key}"}
                resp = requests.get("https://huggingface.co/api/whoami", headers=headers, timeout=5)
                if resp.status_code == 200:
                    user = resp.json().get("name", "User")
                    return {"status": "success", "message": f"HuggingFace Connected as {user}"}
                else:
                    return {"status": "error", "message": "Invalid HuggingFace Token"}
            
            elif provider == "glm":
                 # Basic check for GLM (Zhipu) structure as they don't have a simple public 'whoami' without signing payload
                 if "." not in request.key:
                      return {"status": "warning", "message": "Invalid GLM Key format (usually id.secret)"}
                 return {"status": "success", "message": "GLM Key format valid (No network check)"}
            
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
    from neo4j import GraphDatabase
    try:
        # 5 second timeout for connection verification
        driver = GraphDatabase.driver(request.uri, auth=(request.user, request.password))
        driver.verify_connectivity()
        driver.close()
        return {"status": "success", "message": "Neo4j Connected"}
    except Exception as e:
        return {"status": "error", "message": f"Connection Failed: {str(e)}"}



# -----------------------------------------------------------------------------
# Local NotebookLM (RAG) API
# -----------------------------------------------------------------------------
from fastapi import UploadFile, File
from modules.rag.ingestor import ingestor
from modules.rag.vector_store import vector_store
import shutil
import tempfile
import os

@app.post("/api/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and ingest a document (PDF, Notebook, MD) into the knowledge base."""
    # Save to temp file to handle persistence
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
        
    try:
        # Ingest
        chunks = ingestor.ingest_file(tmp_path)
        
        # Add metadata override for original filename
        for chunk in chunks:
            chunk['metadata']['source'] = file.filename
            
        vector_store.add_documents(chunks)
        return {"status": "success", "message": f"Indexed {len(chunks)} chunks from {file.filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
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


# -----------------------------------------------------------------------------
# Agent Zero Chat API
# -----------------------------------------------------------------------------
class AgentChatRequest(BaseModel):
    message: str

@app.post("/api/agent/chat")
async def agent_chat(request: AgentChatRequest):
    """
    Direct conversational interface with 'Agent Zero'.
    Uses configured Persona and Tools access (simulated or real).
    """
    from runtime.config_loader import load_config
    import requests
    
    cfg = load_config()
    ai_conf = cfg.get("ai_provider", {})
    persona = cfg.get("persona", {})
    
    # Construct System Persona
    role = persona.get("role", "Research Assistant")
    strictness = persona.get("strictness", "conservative")
    
    system_prompt = (
        f"You are Agent Zero, a pharmaceutical AI research assistant based in the BioDockify Virtual Lab. "
        f"Your role is: {role}. Your style is: {strictness}. "
        f"You have access to: PubMed, Local Knowledge Base (RAG), and Molecular Docking Tools (AutoDock Vina). "
        f"If the user asks to perform complex research, explain how you would plan it, or suggest they start a 'Research Task' in the Workstation. "
        f"Answer concisely and helpfully."
    )
    
    # Call LLM (Ollama)
    ollama_url = ai_conf.get("ollama_url", "http://localhost:11434")
    ollama_model = ai_conf.get("ollama_model", "llama3")
    
    try:
        resp = requests.post(
            f"{ollama_url}/api/generate",
            json={
                "model": ollama_model,
                "prompt": request.message,
                "system": system_prompt,
                "stream": False
            },
            timeout=60
        )
        if resp.status_code == 200:
            reply = resp.json().get("response", "I'm sorry, I couldn't generate a response.")
            return {"reply": reply}
        else:
            return {"reply": f"Error interacting with my neural core (Ollama {resp.status_code})."}
            
    except Exception as e:
        return {"reply": f"Connection error: {str(e)}. Is Ollama running?"}


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





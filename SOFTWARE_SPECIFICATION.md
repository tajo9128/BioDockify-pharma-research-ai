# BioDockify Agent Zero - Software Specification

**Version:** 2.15.6
**Date:** January 16, 2026

---

## 1. System Architecture

BioDockify is a hybrid desktop application combining a high-performance native shell with a containerized microservices backend. This architecture ensures cross-platform compatibility while maintaining the performance required for ML tasks.

### High-Level Diagram

```mermaid
graph TD
    User[User] -->|Interacts| UI[Tauri Frontend (React)]
    UI -->|IPC/Http| Core[Desktop Shell (Rust)]
    Core -->|HTTP/REST| API[FastAPI Backend (Python)]
    
    subgraph "Local Intelligence Runtime"
        API -->|Orchestrates| Agent[Agent Zero (Orchestrator)]
        Agent -->|Calls| Tools[Tool Registry]
        Agent -->|Embeds| VectorDB[(Vector Store)]
        Agent -->|Queries| GraphDB[(Neo4j Knowledge Graph)]
        
        Tools -->|Inference| Ollama[Ollama / Local LLM]
        Tools -->|Crawling| Headless[Headless Browser]
        Tools -->|Stats| Analysis[Statistics Engine]
    end
    
    subgraph "External Cloud"
        Agent -.->|Optional| OpenAI[OpenAI / Custom API]
        Agent -.->|Optional| Google[Google Gemini]
        Agent -.->|Optional| Sources[PubMed / Scopus / WoS]
    end
```

### Core Components

1.  **Frontend (UI)**: Built with **Next.js 15, React 19, and TailwindCSS**. It handles the reactive user interface, chat visualizations, and dashboard state.
2.  **Desktop Shell**: **Tauri (Rust)** provides the native window, file system access, and system tray integration. It is lighter and more secure than Electron.
3.  **Backend API**: **Python 3.10+ with FastAPI** serves as the brain. It runs the Agent Zero orchestrator, manages background threads, and handles heavy computation (statistics, parsing).
4.  **Data Layer**:
    *   **Vector Store**: Semantic search for documents.
    *   **Neo4j**: Graph database for entity relationships (Drugs <-> Proteins).
    *   **SQLite**: Configuration and session history.

---

## 2. Directory Structure

A comprehensive breakdown of the codebase organization:

```
BioDockify/
├── api/                        # Python Backend Entry Points
│   └── main.py                 # FastAPI Application & Routes
├── desktop/                    # Native Desktop Wrappers
│   └── tauri/                  # Rust/Tauri Configuration & Source
├── modules/                    # Core Logic Modules
│   ├── agent/                  # Agent Zero System Prompts & Logic
│   ├── analyst/                # Statistical Analysis Engine
│   ├── backup/                 # Google Drive Backup Client
│   ├── headless_research/      # Deep Research (Deep Drive) Crawler
│   ├── journal_intel/          # Authenticity Verification (Predatory Journals)
│   ├── literature/             # API Clients (PubMed, Scopus, etc.)
│   ├── llm/                    # LLM Adapters (Google, OpenAI, Ollama)
│   ├── rag/                    # RAG & Vector Store Logic
│   └── system/                 # System Doctor (Self-Healing Diagnostics)
├── orchestration/              # Agent Planning & Execution
│   ├── executor.py             # Tool Execution Loop
│   └── orchestrator.py         # Main Agent Planning Logic
├── runtime/                    # App Runtime Services
│   ├── config_loader.py        # Settings Management
│   └── service_manager.py      # Background Process Manager (Ollama/SurfSense)
├── tools/                      # Standalone Utility Scripts
├── ui/                         # Frontend Application (Next.js)
│   ├── src/
│   │   ├── app/                # Pages & Routes
│   │   ├── components/         # React Components (Sidebar, Dashboard)
│   │   └── lib/                # API Client & Utilities
│   └── package.json            # Frontend Dependencies
└── package.json                # Project Root Metadata
```

---

## 3. Key Features

### 🧠 Agent Zero (The Core)
*   **Role**: Autonomous research assistant capable of planning and executing complex multi-step workflows.
*   **Constitution**: Operates under a strict "Pharma Research" constitution ensuring accuracy, safety, and evidence citations.
*   **Self-Healing**: Capable of diagnosing its own health (`check_health`), reconfiguring settings (`update_settings`), and restarting services (`restart_service`) via chat commands.
*   **Modes**:
    *   **Chat**: Helpful Q&A assistant.
    *   **Semi-Autonomous**: Asks for permission before major actions.
    *   **Autonomous**: Proactively completes deep research tasks.
    *   **Thesis Writer**: Specialized persona for academic writing.

### 🔬 Research Capabilities
*   **Literature Harvesting**: Aggregates papers from PubMed, PMC, Semantic Scholar, and Scopus (if key provided).
*   **Deep Drive (Deep Research)**: Autonomous headless browsing to "read" full webpages and journals when APIs are insufficient.
*   **Virtual Lab**: Generates experimental protocols (PCR, HPLC, etc.) based on literature.
*   **Statistics Engine**: Performs descriptive and inferential statistics (T-test, ANOVA) on uploaded datasets.

### ✍️ Academic Suite
*   **PhD Thesis Writer**: Structured pipeline to write Introduction, Review, Methods, Results, and Discussion chapters with Citations.
*   **Review Writer**: Systematically reviews literature to create review articles.
*   **Plagiarism Check**: (Simulated/Local) Verification of content originality.
*   **Journal Authenticity**: Checks ISSN/Titles against known predatory journal lists to ensure publication safety.
*   **Reference Management**: Exports in APA, Vancouver, BibTeX, RIS.

### 🛡️ Privacy & Local-First
*   **Local LLM Support**: First-class support for Ollama (Llama 3, Mistral) running entirely offline.
*   **Cloud Fallback**: Option to use Paid APIs (OpenAI, Google, DeepSeek) for enhanced reasoning if privacy permits.
*   **Data Sovereignty**: User data stays on the local filesystem unless explicitly backed up to the user's own Google Drive.

---

## 4. Technical Stack Compliance

*   **Operating System**: Windows (Primary), Linux/macOS (Supported via Docker/Source).
*   **Language Runtime**:
    *   **Python**: 3.10+ (Crucial for `encodings` and backend logic).
    *   **Node.js**: 18+ (Frontend Build).
    *   **Rust**: 1.70+ (Desktop Shell).
*   **Containerization**: Docker (Optional for advanced SurfSense features).

---

## 5. Configuration & Settings

Settings are stored in `config/settings.json` and managed via the UI **Settings Panel**.

*   **AI Providers**: Configure Keys for Google, HuggingFace, OpenRouter, or Custom (OpenAI-compatible).
*   **Models**: Specify Custom Model IDs (e.g., `gpt-4o`, `deepseek-chat`).
*   **Persona**: Adjust the "Strictness" and "Role" of Agent Zero (e.g., "Senior Researcher" vs "PhD Student").
*   **System**: Auto-update, minimized startup, and performance tuning.

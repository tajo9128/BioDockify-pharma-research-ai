# BioDockify v2.9.2 - Agentic Integration Update

**Release Date:** 2026-01-07

### New Features
*   **Agent Zero Integration:** Initial wiring of `AgentZero` into the UI (`/api/v2/agent/goal`).
*   **Thinking Stream:** Real-time visualization of agent reasoning steps via SSE (`/api/v2/agent/thinking`).
*   **Service Health Checks:** Added dashboard status checks for GROBID, Ollama, and Neo4j.
*   **External Tools:** Added support for PubMed Search and GROBID PDF parsing.

### Improvements
*   **UI/UX:** Enhanced `ResearchWorkstation` with live agent feedback and dedicated props.
*   **Configuration:** Added `.env` support for service URL configuration.
*   **Metadata:** Updated application metadata for layout SEO.

### Technical
*   **Backend:** Wired up Python Workspace Skills (DOCX, XLSX, PDF) to the API.
*   **Frontend:** Refactored state management to push Agent state from `page.tsx`.

---

# BioDockify v2.1.2 - Definitive Hotfix

## Release Notes

# Release Notes

## v2.10.0: Local NotebookLM (Jupyter Support)
**Release Date:** 2026-01-07

**Status:** Major Feature Release.

This update introduces **"Notebooks"**, a powerful local-first RAG (Retrieval Augmented Generation) engine inspired by Google NotebookLM.

### 🧠 New Features
- **Upload Jupyter Notebooks (.ipynb)**: BioDockify now natively parses your experiment notebooks, code cells, and outputs.
- **Chat with Your Data**: Ask questions about your uploaded notebooks to get instant answers.
- **Privacy First**: All processing happens locally or via your configured private API key. No data is sent to a public cloud unless you choose to.
- **Vector Search**: Automatic indexing of your documents for semantic search.

---


**Status:** Hotfix.

This patch fixes the "API Test" functionality in settings by replacing mock checks with real network verification.

### 🔌 API Connections
- **Google Gemini**: Now performs a real request to `generativelanguage.googleapis.com` to verify your key.
- **HuggingFace**: Verifies identity via `whoami` endpoint.
- **OpenRouter**: Verifies auth status via their API.
- **Fix**: Removed regex restrictions that were causing valid keys to fail.

---

## v2.9.0: Visual Polish (Transparent Assets)
**Release Date:** 2026-01-07

**Status:** Stable Release.

This release updates the application aesthetics with high-quality transparent assets and includes cumulative bug fixes.

### 🎨 Visual Improvements
- **New App Icon**: Modernized logomark with a transparent background (removed white square).
- **Desktop Shortcut**: Cleaner integration with Windows desktop wallpapers.

---

## v2.8.4: Settings Persistence & UI Hardening
**Release Date:** 2026-01-07

**Status:** Stable Release.

This patch addresses critical bugs in configuration saving and improves UI reliability.

### 🛠 Fixes
- **Config Persistence**: Implemented atomic writes for `config.yaml` to prevent file corruption and ensure reliable saving.
- **Settings UI**: Added verification step (reload-after-save) to confirm settings are persisted.
- **Error Handling**: Enhanced logging for save operations.

---


## v2.8.2: CI Reliability Fixes
**Release Date:** 2026-01-07

**Status:** Stable Release.

This patch release ensures the verified icon asset is correctly committed to the repository to satisfy CI checks.

### 🛠 Fixes
- **Repo Integrity**: Restored `icon.png` which was missing from previous builds.
- **CI**: Validated asset existence.

---


## v2.8.1: CI Trigger Fix & Final Icon Polish
**Release Date:** 2026-01-07

**Status:** Stable Release.

This patch release is issued to proactively trigger the release pipeline with the corrected assets.

### 🛠 Fixes
- **Build Trigger**: Fresh tag to ensure GitHub Actions picks up the corrected `icon.png`.
- **Icon**: Confirmed valid PNG format.

---


## v2.8.0: Critical Build Fixes (Icon Format)
**Release Date:** 2026-01-07

**Status:** Stable Release.

This release explicitly fixes the icon file format issue causing CI build failures.

### 🛠 Critical Fixes
- **Icon Format**: Converted `icon.png` from JPEG (mislabeled) to proper PNG format using PowerShell image processing.
- **Build Stability**: Ensured valid assets for Tauri icon generation.

---


## v2.7.0: Critical Build & UI Fixes
**Release Date:** 2026-01-07

**Status:** Production Release.

This release addresses critical CI build failures and finalizes the UI enhancements.

### 🛠 Critical Fixes
- **Icon Generation**: Resolved "Invalid PNG signature" error by replacing the corrupted source icon with a re-generated valid PNG. This ensures the installer icon is built correctly.
- **CI Pipeline**: Verified build stability with the new assets.

### 🚀 Features (Cumulative v2.4+)
- **Sidebar Navigation**: Full support for Research, Results, and Lab views.
- **Settings Panel**: Integrated system configuration panel.
- **UI Structure**: Enhanced page layout with improved view routing.

---


## v2.3.0: Academic Integrity & Compliance Layer
**Release Date:** 2026-01-06

**Status:** Major Feature Release.

This release introduces the **Academic Writing Compliance & Integrity Layer**, designed to ensure scientific quality, evidence grounding, and human verification of all AI-assisted drafts.

### 🛡️ New Features
- **Compliance Panel**: A real-time analysis tool available in "Write" mode.
- **Academic Style Normalizer**: Detects generic AI phrasing and suggests scientific alternatives.
- **Evidence Checker**: Enforces citation density to prevent hallucinations.
- **Human Revision Gate**: **Mandatory** verification step. Users must confirm citation accuracy and authorship before export is unlocked.
- **Disclosure Generator**: Standardized AI usage disclosure statement for manuscripts.

### ⚠️ Important Architecture Change
- **Export Control**: The "Export Manuscript" button is now **locked by default** until the Compliance Check passed and Human Revision is confirmed.

---


## v2.2.0: The "Agent Zero" Integration Update
**Release Date:** 2026-01-06

**Status:** Major Feature Release.

This release integrates the external "Agent Zero" architecture and "Universal Skills" from the `workspace` archive, making BioDockify a fully agentic platform.

### 🌟 New Features
- **LLM Provider Architecture**:
  - **Dynamic Switching**: Use Cloud (z-ai) or Local (Ollama) LLMs seamlessly.
  - **Fallback System**: Auto-switches providers if one fails.
- **Universal Skills Integration**:
  - Added `DOCX`, `PDF`, `XLSX` generation skills.
  - Added `Web Search`, `Web Reader`, `ASR` (Voice), `TTS` (Speech) skills foundation.
- **New API Endpoints**:
  - `POST /api/research`: Full agentic research task handling.
  - `POST /api/export`: Multi-format report generation (PDF, DOCX, etc.).

### 🛠️ Improvements
- **Frontend Core**: Refactored `page.tsx` now calls the real Agentic API (`api.startResearch`) instead of simulations.
- **Mini-Services**: Integrated `research-updater` WebSocket service for real-time progress.

---


## v2.1.18: Sidebar Import Fix
**Release Date:** 2026-01-06

**Status:** Hotfix for v2.1.17 component import error.

This release resolves the `Sidebar` import error that caused the v2.1.17 build to fail.

### 🐛 Bug Fixes
- **Frontend Import**: Corrected `page.tsx` to use default import for `Sidebar` component (`import Sidebar from ...`) instead of named import, matching the component definition.

---


## v2.1.17: Critical UI Build Fix & Pharma Integrity Suite
**Release Date:** 2026-01-06

**Status:** Critical Hotfix for v2.1.16 build failures.

This release includes the full **Pharma Integrity Suite** (10 new compliance/validation tools) and a **complete rewrite of the frontend core** (`page.tsx`) to strictly resolve the persistent "Unexpected token div" build error.

### 🛠️ Critical Fixes
- **Frontend Core Rewrite**:Completely rebuilt `ui/src/app/page.tsx` with strict TypeScrip/JSX compliance to eliminate parsing errors.
- **Build Stability**: Verified component nesting and imports to ensure Next.js 15 build success.

### 🛡️ Features (Pharma Integrity Suite)
- **Access**: Unpaywall, CORE (Legal OA).
- **Validation**: ScienceParse, CERMINE, PubTator.
- **Impact**: Semantic Scholar Ranker.
- **Export**: LanguageTool, Detoxify, Zotero CSL.

---

## 🌟 v2.1.2: Stable Release
- **Frontend Syntax Fix**: Resolved critical build error in `page.tsx` (restored missing view wrappers).
- **Core Stability**: Consolidates all v2.1.1 patches (Config Resilience, Installer Paths).
- **Verified**: Full manual audit of build artifacts and source code.

## 🚨 v2.1.1: Deep Path Resilience (Hotfix)
- **Config Loader Refactor**: Now intelligently detects production (`Frozen`) vs development environments.
  - **Production**: Stores config in `%APPDATA%\BioDockify\config.yaml` to prevent permissions issues in Program Files.
  - **Development**: Falls back to local runtime directory.
- **Installer Update**: Bumped to `v2.1.1`. Fixed output paths to be robust.
- **Build Fix**: Resolved Frontend JSX syntax error in `page.tsx`.

## 🚀 New Features (v2.1.0)

### 1. Perplexity-Like Research Experience
- **100% Local/Hybrid Engine**: Replaces paid external APIs with your local LLMs (Ollama) + Free Public Science APIs (PubMed/OpenAlex).
- **Intent-First Interface**: New simplified home screen focusing on research questions.
- **Three Modes**:
  - **Search**: Pure retrieval, no hallucination.
  - **Synthesize**: Knowledge graph construction and pattern linking.
  - **Write**: Structured drafting with citation verification.
- **Evidence Panel**: Real-time source tracking and "Confidence Meter".
- **Explain-Why Engine**: Transparent view of Agent Zero's reasoning process.

### 2. Agent Zero Logic Engine
- **Mode Enforcement**: Strictly constrains AI behavior based on selected mode.
- **Citation Lock**:
  - **Conservative Mode**: Automatically blocks writing until evidence is verified.
  - **Novelty Gate**: Prevents low-novelty paths in Exploratory mode.
- **Dynamic Persona Injection**: System prompts now adapt to your specific settings (Role, Strictness, Purpose).

### 3. PhD-Grade Literature System
- **Tiered Scraping**: PubMed -> EuropePMC -> CrossRef -> OpenAlex -> Preprints.
- **Audit Logging**: Full "Methods Section" generation for publications.
- **Compliance**: Respects robot.txt and API rate limits.

## 🛠 Technical Changes
- **Backend (`api/`)**: Updated `start_research` endpoint to support `mode`.
- **Orchestrator**: Implemented logic gates in `plann_research` and `_build_prompt`. Removed Legacy OpenAI/Cloud API keys.
- **Frontend (`ui/`)**: Added `lucide-react` icons and new "Glassmorphism" UI components.
- **Installer**: Updated `setup.nsi` with clean uninstallation logic (removes all Shortcuts/Startup entries).
- **Config**: Extended `config_loader.py` with `agent_zero` and `user_persona` schemas.

## ✅ Verification
- **Test Suite**: `tests/verify_agent_logic.py` confirms all logic gates are active.
- **Validation**: `tests/verify_literature_system.py` confirms 100% compliant data harvesting.

## 📦 Install Instructions
1. Run `installer/setup.nsi` to generate the new `BioDockify_Professional_Setup_v2.0.exe`.
2. Ensure Docker Desktop is running for the local vector database.
3. Check `README.md` for Ollama model setup (`ollama pull llama2`).

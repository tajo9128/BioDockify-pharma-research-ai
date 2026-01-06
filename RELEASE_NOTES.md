# BioDockify v2.1.2 - Definitive Hotfix

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

# BioDockify AI Release v2.8.4 - 2026-02-15

## 🧬 Major Stability Update

This release focuses on hardening the BioDockify core, aligning versioning across the entire ecosystem, and ensuring cross-platform compatibility for Windows and Linux.

### 🛠️ Core Improvements & Fixes
- **Research Engine Hardening**: Fixed a critical `NameError` in `headless_research/engine.py` by normalizing `re` module imports.
- **Path Normalization**: Eliminated hardcoded Linux-style paths in `statistics/orchestrator.py` to ensure reliable exports on Windows environments.
- **Deduplication**: Audited `api/main.py` and consolidated redundant health check and settings endpoints.
- **Skill Verification**: Integrated and verified `scholar_complete` and `summarize_content` skills in the `HybridAgent` stack.

### 📦 Ecosystem Updates
- **v2.8.4 Alignment**: synchronized version strings across:
  - Backend API (`api/main.py`)
  - Frontend UI (`ui/package.json`)
  - Core Package (`package.json`)
  - Containerization (`Dockerfile`)
  - Documentation (`README.md`, `CHANGELOG.md`)

### 🚀 Deployment
- **Docker**: The "Fully Baked" Docker image is now stabilized for `v2.8.4`.
- **Requirements**: Updated `api/requirements.txt` for consistent dependency management.

---
**Version:** 2.8.4
**Status:** Stable Release
**Build Date:** 2026-02-15

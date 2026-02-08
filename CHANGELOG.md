# Changelog

All notable changes to **BioDockify** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.3.8] - 2026-02-08
### Fixed
- **Thesis Engine:** Fixed critical bug where `_generate_with_agent` was missing, preventing agent-based chapter generation.
- **API:** Resolved missing `research_router` inclusion in `api/main.py`, enabling real-time status WebSockets for researchers.
- **Diagnostics:** Fixed critical deadlock in `ConnectionDoctor` where synchronous network checks caused the backend to hang during initialization.
- **Docker:** Fixed Nginx routing to properly serve Next.js static files (`/_next/static/`), resolving 404 errors on initialization.
- **Pharma AI:** Improved error handling in synthesis modules.

### Added
- **Literature Review:** New dedicated API endpoints for multi-source literature search (`/api/literature/search`) and automated synthesis (`/api/literature/synthesize`).
- **Orchestration:** Integrated `ReviewSynthesizer` with Agent Zero callbacks for high-fidelity research generation.

## [v2.3.1] - 2026-02-07
### Added
- **Major Release**: Version jump to v2.3.1.
- **Docker:** Comprehensive release fix. Corrected Next.js standalone paths, improved startup scripts, and removed error suppression on critical dependencies.
- **CI:** Harmonized CI Python version to 3.11 and Node.js to 20 to match Docker environment.
- **GitHub:** Fixed 403 error during release by granting `contents: write` permissions to `GITHUB_TOKEN`.

## [v2.20.10] - 2026-02-07
### Fixed
- **Docker:** Comprehensive release fix. Corrected Next.js standalone paths, improved startup scripts, and removed error suppression on critical dependencies.
- **CI:** Harmonized CI Python version to 3.11 and Node.js to 20 to match Docker environment.

## [v2.20.9] - 2026-02-07
### Fixed
- **Docker:** Quoted pip version ranges in `Dockerfile` to prevent shell redirection errors (`<2.0.0` being interpreted by `/bin/sh`).

## [v2.20.8] - 2026-02-07
### Fixed
- **Docker:** Fixed build failure by replacing obsolete `libgl1-mesa-glx` with `libgl1` and `libglx-mesa0` for compatibility with Debian Bookworm.

## [v2.20.7] - 2026-02-07
### Fixed
- **Docker:** Fixed build failure by replacing missing `libatlas-base-dev` with `libopenblas-dev` in the Python slim image.

## [v2.20.6] - 2026-02-07
### Fixed
- **Core:** Skill Internalization - All skills (`LatteReview`, `Achademio`, `ScholarCopilot`, `Deep Drive`) are now fully internal to the codebase, removing the need for external submodules or git credentials during Docker build/run.
- **Dependencies:** Resolved critical dependency conflict between `litellm` and `openai`. Synchronized requirements for Docker/Server environments.
- **CI:** Fixed CI pipeline by implementing a backend health-check wait before running integration tests.
- **Stability:** Enhanced `LatteReview` with explicit import error tracebacks for easier debugging in containerized environments.

## [v2.19.4] - 2026-02-04
### Added
- **First-Run Experience:** "Hit the Ground Running" - Agent Zero now auto-detects LM Studio and immediately configures the backend for use.
- **Connection Health:** Added "Diagnose & Auto-Repair" capability in Settings. If a connection fails, Agent Zero can now investigate the port and suggest fixes (e.g., loading a model).
- **Agent Zero Chat:** Fully integrated real LLM chat in the backend. The `/chat` interface now connects directly to your local LM Studio instance via the `LLMFactory` (no more mock responses).
- **Settings Security:** Auto-configured settings are now "locked" by default to prevent accidental breakage, with an easy "Unlock" option.

### Fixed
- **Settings UI:** Fixed duplicate/broken syntax in `SettingsPanel.tsx`.
- **Backend:** Added missing `/api/diagnose/lm-studio/start` endpoint.
- **Backend:** Added missing `/api/agent/chat` endpoint.

## [v2.18.9] - 2026-02-01
### Fixed
- **Build**: Fixed Rust compilation error by restoring mutability to sidecar receiver channel.

## [v2.18.8] - 2026-02-01
### Fixed
- **Release Automation**: Fixed release trigger by ensuring version tags are properly used to fire the CI/CD pipeline.
- **Build**: Consolidated build fix for backend sidecar.

## [v2.18.7] - 2026-02-01
### Fixed
- **Connectivity**: Resolved critical port mismatch between Desktop App (8234) and Backend (8000).
- **Error Handling**: Improved error messages when the backend is unreachable.
- **Build System**: Fixed "os error 2" during bundling by ensuring the backend sidecar binary is correctly built and placed in `src-tauri/bin`.

## [2.18.6] - 2026-02-01
### Fixed
- **Testing:** Fixed a timeout in CI caused by `DECIMER` model downloading during smoke tests. Verification is now metadata-based.

## [2.18.4] - 2026-01-29
### Added
- **LLM Integration:** Full Agent Zero integration for Screening, Synthesis, Thesis, and Slide Generation modules.
- **Literature:** Implemented Unpaywall API integration for legal open-access paper discovery.
- **Science:** Verified Molecular Vision (DECIMER) and Statistics modules operation.

### Fixed
- **Critical:** Resolved Neo4j dependency in `server.py` allowing proper startup without graph database.
- **Architecture:** Consolidated SurfSense clients into a single source of truth.
- **Performance:** Optimized startup imports for faster load times.

## [2.18.0] - 2026-01-29
### Added
- **Settings UI:** New Settings Page (`/settings`) for configuring API keys and System preferences.
- **Chat UI:** New Agent Chat Interface (`/chat`) skeleton.

### Fixed
- **Critical:** Fixed Python 3.13 incompatibility (enforced 3.11).
- **Critical:** Fixed "First-Run Wizard" hang by adding `/api/diagnose/connectivity` endpoint.
- **Bug Fixes:** 
    - Fixed `LMStudioAdapter` variable typo.
    - Fixed Google API URL typo.
    - Fixed HuggingFace key variable mismatch.
    - Fixed duplicate sections in `runtime/config.yaml`.
    - Improved `ConnectivityHealer` status handling for "degraded" states.

## [2.17.9] - 2026-01-29
### Changed
- **System Stability:** Verified variable names and API endpoints for Google/HuggingFace adapters.
- **Maintenance:** Routine version bump and stability check.

## [2.17.8] - 2026-01-29
### Added
- **Documentation:** Added Python 3.13 compatibility guide (`SETUP_PYTHON.md`) and environment check script (`check_environment.py`).

### Changed
- **First-Run Wizard:** Removed "API Keys" check step. Users execute this configuration later in Settings.

## [2.17.7] - 2026-01-29
### Fixed
- **Dependencies:** Added missing `tabulate` package for pandas markdown tables.

## [2.17.6] - 2026-01-29
### Added
- **First-Run Wizard:** Added "Continue to Settings" bypass button for offline usage.
- **Diagnostics:** Explicit guidance to enable CORS for LM Studio connections.

### Changed
- **Core:** Synchronized version numbers across all project files.
- **Maintenance:** Routine internal release to ensure build consistency.

## [2.0.40] - 2026-01-05
### Added
- Complete documentation suite conforming to academic/open-source standards.
- `METHODOLOGY.md` explaining the Agentic AI and GraphRAG approach.
- `ARCHITECTURE.md` with system diagrams.
- `ETHICS_AND_LIMITATIONS.md` disclosing AI safety and bias.
- `USER_GUIDE.md` for workflow instructions.

## [2.0.39] - 2026-01-05
### Fixed
- **Installer:** Added missing `LICENSE` file which caused `LicenseData` error during NSIS build.
- **Legal:** Added Apache 2.0 License text.

## [2.0.38] - 2026-01-05
### Fixed
- **Branding:** Fixed generic "PyMOL" style installer header. Now uses BioDockify branding.
- **Icons:** Fixed missing Desktop Shortcut icon and Installer window icon.

## [2.0.37] - 2026-01-05
### Fixed
- **Installer:** Fixed "Silent Failure" by adding `RequestExecutionLevel admin`.
- **UX:** Added explicit "Desktop Shortcut" checkbox (enabled by default).
- **UX:** Added "Components" selection page.

## [2.0.36] - 2026-01-05
### Changed
- **Release Workflow:** Force push to sync `main` and trigger release pipeline.

## [2.0.35] - 2026-01-05
### Fixed
- **CI/CD:** Removed premature `Move-Item` command in `release.yml` that caused build failures.
- **CI/CD:** Switched to module-based PyInstaller invocation (`python -m PyInstaller`) for environment consistency.

## [2.0.0] - 2026-01-01
### Added
- **Core:** Initial release of BioDockify Desktop.
- **AI:** Integration of "Agent Zero" orchestrator.
- **Graph:** Neo4j local database integration.
- **UI:** React+Tauri frontend.

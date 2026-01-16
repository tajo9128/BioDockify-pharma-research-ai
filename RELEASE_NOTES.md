# Release Notes

## v2.15.1 - Critical Hotfix
- **Hotfix**: Resolved `IndentationError` in `api/main.py` causing backend failing start.
- **Documentation**: Added comprehensive `SOFTWARE_SPECIFICATION.md` detailing system architecture and roles.
- **Stability**: Verified Agent Zero's self-healing capabilities in production mode.

## v2.15.0
- **New Feature**: Added support for Paid APIs (OpenAI / Compatible) in the Settings Panel.
- **Improvement**: Users can now specify a custom Model ID (e.g., `gpt-4o`) for API connections.
- **UI Update**: Sidebar reorganization - "Scientific Method" merged into Workstation, "Publication" merged into Academic Suite.
- **Fix**: Adjusted API Test connection logic to support custom models (fixing "DeepSeek" connection issues).
- **Environment**: Improved Python environment detection for the "Doctor" diagnostic tool.

## v2.14.9 - Critical Build Fix
*Released: January 16, 2026*

### 🛠️ Configuration Fixes
- **Binary Naming**: Restored `productName` in `tauri.conf.json`. This ensures the output binary is named `BioDockify.exe` (matching build scripts) rather than `biodockify-ai.exe`.
- **System Sync**: All components updated to v2.14.9.

## v2.14.8 - Build Logic Fixes
*Released: January 15, 2026*

### 🛠️ Build Artifact Correction
- **Installer Versioning**: Fixed stale version numbers in `tauri.conf.json` and `setup.nsi`. Installers will now correctly be named `BioDockify_2.14.8_...exe` instead of using old version identifiers.
- **Sync**: All 7 configuration files are now strictly aligned to v2.14.8.

## v2.14.7 - Self-Repair System & Doctor
*Released: January 15, 2026*

### 🏥 The "System Doctor"
- **New Module**: `modules/system/doctor.py` actively probes system health.
- **Service Watchdog**: `ServiceManager` now monitors and attempts to repair crashed AI services (Ollama/SurfSense).
- **Diagnostics API**: New `/api/v2/system/diagnose` endpoint provides a full health report JSON.
- **Self-Repair Button**: New `/api/v2/system/repair` endpoint allows the frontend to trigger service restarts.

### 🐛 Fixes
- **First Run Wizard**: Fixed critical syntax error preventing the setup screen from rendering.
- **Dependencies**: Improved startup checks for critical Python libraries.

## v2.14.6 - API V2 & Robustness Fixes
*Released: January 15, 2026*

### 🚀 Key Features
- **Agent V2 API**: Implemented `/api/v2/agent/goal` and `thinking` endpoints to power the new Agent Zero UI.
- **Robustness**: Added graceful fallback for Ollama service failures and portable configuration encryption.
- **API Client Refactor**: Modularized Google, OpenRouter, and HuggingFace clients into `modules/llm`.

### 🐛 Fixes
- **Startup Resilience**: Backend no longer crashes if Local AI is missing; defaults to cloud keys.
- **Encryption**: Configuration decryption now catches invalid keys (machine change) and resets gracefully.

## v2.14.0 - Backend Stability & Fixes
*Released: January 13, 2026*

- **Bug Fix**: Resolved `NameError` in `api/main.py` causing backend test failures.
- **Dependency**: Fixed missing `nbformat` and `tensorflow` compatibility issues in test environment.
- **Stability**: Validated `LibraryQuery` model definition ordering.

## v2.13.3 - Critical UI Fix & Service Manager
*Released: January 9, 2026*

- **Bug Fix**: Resolved critical syntax error in `ResearchWorkstation.tsx`.
- **Feature**: Added silent auto-start for Ollama and Neo4j (`ServiceManager`).
- **Stability**: Integrated offline mode indicators and auto-save hooks properly.

## v2.13.2 - Emergency Build Trigger
*Released: January 9, 2026*

- **Emergency Release**: Fresh build trigger to bypass previous CI cache/stale state.
- **Verification**: Confirmed `page.tsx` syntax fix is present in this build.

## v2.13.1 - Robustness Application
*Released: January 9, 2026*

- **Hotfix Release**: Ensuring all robustness pillars are correctly applied and versioned.
- **Force Sync**: Aligned `main` and `development` branches with the latest architecture.

## v2.13.0 "Titanium" - The Robustness Update
*Released: January 9, 2026*

This major release focuses on enterprise-grade stability, security, and resilience, implementing the "10 Pillars of Robustness" architecture.

### 🛡️ Security & Privacy
- **Encryption at Rest**: Sensitive API keys and passwords in `config.yaml` are now encrypted using a machine-specific key.
- **Input Hardening**: Enhanced protection against XSS attacks in the web fetcher; The system now actively strips dangerous tags (`object`, `embed`).
- **Encrypted PDF Guard**: The ingestion engine now gracefully rejects password-protected PDFs instead of hanging.

### ⚙️ Stability & Reliability
- **Auto-Restart Sidecar**: The Python backend analysis engine will now automatically restart if it encounters a critical crash.
- **Offline Awareness**: Added a visual "OFFLINE MODE" indicator to the workstation when network connectivity is lost.
- **Auto-Save**: Research goals and operation modes are now automatically saved to local storage to prevent data loss during accidental closures.
- **Database Resilience**: Implemented robust connection pooling for the local database.

### 📊 Observability
- **Structured Logging**: All backend logs now output in structured JSON format for easier debugging and monitoring.
- **Audit Trails**: Every API request is now logged with detailed metrics (latency, status, client IP).
- **Resource Monitoring**: A background system guard monitors RAM and CPU usage, alerting when memory exceeds 90%.

### 🏗️ Infrastructure
- **CI/CD Pipeline**: Added automated testing workflows (`ci-tests.yml`) running on every push.
- **Backend Test Suite**: Initial coverage for API health, configuration, and security modules.
- **Config Management**: Added support for `BIO_ENV` to load environment-specific configurations (`config.dev.yaml`, `config.prod.yaml`).
- **Config Backup**: Automatic backup of configuration files before saving.

### 🐛 Bug Fixes
- Fixed a critical syntax error in `page.tsx` that caused build failures in v2.11.1.
- Fixed dependency vulnerabilities in UI packages.

---

## v2.11.2 - Hotfix
- Fixed build syntax error in `page.tsx`.

## v2.11.1 - Stability Patch (Deprecated)
- Initial attempt at robustness features.

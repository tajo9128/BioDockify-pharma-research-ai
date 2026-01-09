# Release Notes

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

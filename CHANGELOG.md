# Changelog

All notable changes to **BioDockify** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.4.6] - 2026-02-10
### Added
- **Stability and Performance**: Continued optimization of the Docker build process and dependency management.

## [v2.4.5] - 2026-02-10
### Fixed
- **Docker Build Recovery**: Resolved `Unknown lockfile version` error by removing corrupt lockfiles and updating the build process.
- **Dependency Stability**: Hardened UI dependency installation by allowing fresh lockfile generation during build.

## [v2.4.4] - 2026-02-10
### Added
- **Enhanced Project System**: Implemented `ProjectPlanner`, `DeviceStateManager`, and `MultiTaskScheduler` for complex research orchestration.
- **Persistence & Progress**: Added task queue persistence and granular progress tracking for long-running research jobs.
- **Headless Resilience**: Made Playwright an optional dependency, allowing the system to run in a degraded mode when browser environments are restricted.
- **Git Maintenance**: Consolidated repository branches into `CI` and `Docker-release`.

## [v2.4.2] - 2026-02-09
### Added
- **Full Agent Zero Port**: Reached 100% parity with original Agent Zero core, including PhDPlanner (stage-aware research), PersistentMemory (long-term knowledge retention), and self-healing ReasoningEngine.
- **Security Hardening**: Implemented strict HTML escaping in Telegram to prevent XSS, added path sanitization to all file downloads, and enforced authentication for the WhatsApp bridge.
- **Reliability Improvements**: Added Discord gateway heartbeat ACK tracking to prevent zombie connections and implemented per-channel rate limiting and download timeouts.
### Removed
- Feishu/Lark channel integration (deprecated as per user request).

## [v2.4.1] - 2026-02-09
### Fixed
- **Integrity:** Resolved critical SQLite connection leaks in `task_store.py` using context managers.
- **Resource Management:** Fixed memory leaks in `ZAIProvider` and `ServiceLifecycleManager` by ensuring timeouts are cleared.
- **API Resilience:** Added 60s timeout and non-JSON error handling to the frontend API client.
- **Logic:** Fixed undefined `prompt` variable in HuggingFace provider and initialized `tmp_path` for RAG uploads.
- **WebSocket:** Fixed reconnection leaks in `AgentStatusPanel.tsx`.

## [v2.4.0] - 2026-02-08
...

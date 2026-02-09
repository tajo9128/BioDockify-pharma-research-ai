# Changelog

All notable changes to **BioDockify** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

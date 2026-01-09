# Release Notes

## v2.11.0 (Stable Milestone)
**Release Date:** 2026-01-09

### 🌟 Major Features
- **Agent Zero Internet Research**: Fully enabled public web research capabilities. Agent Zero can now search the web, read pages, and synthesize answers with real-time context.
- **Custom AI Provider**: Added generic "OpenAI Compatible" API support for local or paid LLM endpoints (e.g. together.ai, fireworks.ai).
- **Backend Chat Integration**: New `/api/agent/chat` endpoint handles all AI traffic with improved error handling and provider switching.

### 🛡️ Security & Stability
- **Safe Uninstaller**: Fixed installer logic to prevent accidental deletion of parent directories. Now enforces installation to `Program Files/BioDockify`.
- **Client Stability**: Resolved critical client-side crash caused by missing strict mode (`use client`) and incorrect imports in TitleBar/AgentChat.
- **Build System**: Fixed syntax errors in `SettingsPanel` that were blocking CI builds.

### 🐛 Bug Fixes
- Fixed "Run System Diagnostics" menu integration.
- Fixed `Activity` icon import errors.
- Fixed `MenuItem` module resolution crash.

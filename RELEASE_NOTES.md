# Release Notes

## v2.10.9 (Production Release)
**Release Date:** 2026-01-09

### 🚀 New Features
- **Agent Zero Internet Research (No API)**: Enabled by default! Agent Zero can now fetch and read public web pages directly using a built-in scraper, without requiring paid API keys.
- **Custom / Paid API Support**: Replaced hardcoded GLM integration with a generic "OpenAI Compatible" configuration. You can now use ANY provider (DeepSeek, Zhipu, local vLLM, etc.) by specifying a Base URL + Key.
- **Functional Title Bar**:
  - **File Menu**: Added import options for PDF, Word, Text, Markdown, Jupyter Notebooks, and Data files directly into NotebookLM.
  - **Edit & View**: Added basic clipboard and zoom controls.
- **Backend Connection Proxy**: Added a dedicated backend proxy for Ollama connections to bypass browser CORS restrictions.

### 🐛 Bug Fixes
- **Ollama Connectivity**: Fixed issue where local Ollama instances (`localhost:11434`) were unreachable from the UI due to CORS.
- **Neo4j Troubleshooting**: Improved Neo4j connection tests to provide detailed error messages (e.g., "Driver not installed", "Auth failure").
- **Cloud API Tests**:
  - Fixed OpenRouter connection failures by adding required `HTTP-Referer` and `X-Title` headers.
  - Improved error reporting for Google Gemini and Hugging Face API tests.
- **Settings Panel**: Fixed syntax errors in the settings configuration that could cause white screens.

### 🔒 Security & Performance
- **Tauri Permissions**: Verified and hardened API allowlist for `http` and `dialog` modules.
- **Headers**: Enforced best-practice headers for all external API calls.

---

## v2.10.8
- **Fix**: Critical Tauri permission updates for `window` and `dialog` APIs.
- **Fix**: Resolved "Browse" button non-functionality in Settings.
- **New**: Added "Open Folder" button for output directory.
- **New**: Visual feedback for Cloud API key testing.

## v2.10.7
- **UI**: Updated Title Bar to "BioDockify".
- **Fix**: Solved Window Control (Minimize/Maximize/Close) clickability issues.
- **Fix**: Addressed Next.js SSR errors with dynamic imports.

## v2.10.6
- **Fix**: Uninstaller now safely removes only the application folder (NO recursive delete of parent).
- **Fix**: Settings persistence issues resolved.

## v2.10.5
- **Feature**: Added "First Run Wizard" for initial setup.

## v2.10.4
- **Feature**: Integrated Neo4j Graph Database support.

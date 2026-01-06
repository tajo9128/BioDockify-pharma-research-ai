# Contributing to BioDockify

Thank you for your interest in building the future of autonomous pharmaceutical research! We prioritize scientific rigor, code safety, and user privacy.

## Development Standards

### 1. "Pharma-Grade" Safety
*   **No Hallucinations**: All features involving text generation MUST implement a verification step or citation lock.
*   **Privacy First**: No telemetry is strictly preferred. If added, it must be opt-in.
*   **Local Default**: Features should function (even if degraded) without internet access using local LLMs.

### 2. Code Quality
*   **Frontend**: React Functional Components, Typed Props, Lucide Icons.
*   **Backend**: Type-hinted Python, Pydantic Models for all data exchange.
*   **Commits**: Conventional Commits (e.g., `feat: add semantic scholar ranking`, `fix: battery monitor race condition`).

### 3. Architecture
*   **UI**: `ui/src/components` (Dumb components) vs `ui/src/app` (Page logic).
*   **Orchestration**: `orchestration/planner` (Logic) vs `orchestration/runtime` (Execution).

## Getting Started

1.  Ensure you have `Ollama` running for local tests.
2.  Run `pytest` to check compliance modules.
3.  Use `npm run lint` before pushing frontend code.

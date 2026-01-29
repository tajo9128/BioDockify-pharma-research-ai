# Changelog

All notable changes to **BioDockify** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

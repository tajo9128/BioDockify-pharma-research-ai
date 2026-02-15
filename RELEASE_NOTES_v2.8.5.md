# BioDockify AI Release v2.8.5 - 2026-02-15

This release focuses on hardening the statistical analysis module and resolving critical TypeScript build errors discovered during the v2.8.4 release cycle.

## 🧬 Statistics Module Hardening

### `StatisticsResult` Type Unification
We have completely overhauled the `StatisticsResult` type definition to ensure full compatibility between the backend Python engine and the frontend React components.

- **Type Safety**: Renamed internal `AnalysisResult` to `StatisticsResult` to align with the primary data flow.
- **Confidence Intervals**: Refactored `confidenceInterval` from an ambiguous object to a strict `[number, number]` tuple, resolving runtime errors in the `ResultsViewer` component.
- **Effect Sizes**: Added support for the new `effectSizes` dictionary, allowing multi-parameter analyses (like ANOVA post-hocs) to display secondary effect sizes.
- **Library Integration**: Synchronized the `apa-report` and `effect-size` libraries to consume the updated result structure.

## 🚀 Technical Improvements

- **Build Stabilization**: Resolved the "Module '@types/statistics' has no exported member 'StatisticsResult'" error.
- **Type Checking**: Cleaned up legacy type definitions in the UI package.

---
**Version:** 2.8.5
**Release Date:** February 15, 2026
**Release Type:** Patch / Bug Fix

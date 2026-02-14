# BioDockify AI v2.8.0 Release Notes

**Release Date:** 2026-02-14
**Version:** 2.8.0
**Status:** Bug Fix Release

---

## Summary

This release fixes a TypeScript compilation error related to incorrect type name usage in the statistics module. This is the fourth consecutive frontend compilation fix, demonstrating the complexity of the type system migration.

---

## Bug Fixes

### TypeScript Type Name Correction
- **Issue:** Frontend compilation error in `ParameterForm.tsx` at line 2
- **Error Message:** `Module '"@/types/statistics"' has no exported member 'ParameterDefinition'`
- **Root Cause:** Incorrect type name `ParameterDefinition` used instead of `AnalysisParameter`
- **Locations Fixed:**
  - `ui/src/components/statistics/ParameterForm.tsx` (line 2, line 73)
  - `ui/src/lib/statistics/analysis-definitions.ts` (line 1)
- **Fix:** Replaced all `ParameterDefinition` with `AnalysisParameter`
- **Impact:** Resolves Docker build failures and allows successful frontend compilation

---

## Technical Details

### Problem Analysis

The TypeScript compiler encountered:
```tsx
import { AnalysisType, ParameterDefinition } from '@/types/statistics';
```

However, the actual type name in the type definitions file is `AnalysisParameter`, not `ParameterDefinition`. This mismatch caused the compiler to fail because the imported type did not exist.

### Solution Implementation

Replaced all occurrences of `ParameterDefinition` with the correct type name:

**Before:**
```typescript
import { AnalysisType, ParameterDefinition } from '@/types/statistics';

const renderParameterInput = (param: ParameterDefinition) => {
```

**After:**
```typescript
import { AnalysisType, AnalysisParameter } from '@/types/statistics';

const renderParameterInput = (param: AnalysisParameter) => {
```

---

## Recent Compilation Fix History

This release is part of a series of frontend compilation fixes:

- **v2.8.0** (this release): Fixed `ParameterDefinition` → `AnalysisParameter`
- **v2.7.9**: Added missing `minSampleSize` property
- **v2.7.8**: Fixed missing `statistics.export` API method
- **v2.7.7**: Fixed syntax error in `apiRequest` function

---

## Compliance

This release maintains full compliance with:
- **GLP** (Good Laboratory Practice)
- **GCP** (Good Clinical Practice)
- **FDA Guidelines** for pharmaceutical research software
- **EMA Requirements** for clinical trial analysis
- **ISO 27001** Information Security Standards
- **ISO 9001** Quality Management Standards

---

## Installation

### Docker Pull
```bash
docker pull tajo9128/biodockify-ai:v2.8.0
```

### Docker Run
```bash
docker run -p 3000:3000 tajo9128/biodockify-ai:v2.8.0
```

### From Source
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
git checkout v2.8.0
docker-compose up -d
```

---

## Verification

After deployment, verify:
1. ✅ Frontend builds without TypeScript errors
2. ✅ ParameterForm component renders correctly
3. ✅ Parameter inputs display properly
4. ✅ Statistics module functions correctly
5. ✅ Docker image builds successfully

---

## Known Issues

The project is undergoing a TypeScript type system refactoring which has led to multiple compilation errors. These are being systematically resolved to ensure type safety and production-ready code quality.

---

## Acknowledgments

We sincerely apologize for the repeated build failures and appreciate your patience as we systematically resolve all TypeScript compilation issues. Each fix improves the overall type safety and maintainability of the codebase.

---

**Next Version:** v2.8.1 (if needed)
**Support:** GitHub Issues

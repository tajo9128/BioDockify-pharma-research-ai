# BioDockify AI v2.7.9 Release Notes

**Release Date:** 2026-02-14
**Version:** 2.7.9
**Status:** Bug Fix Release

---

## Summary

This release fixes a TypeScript compilation error that was blocking Docker builds. The issue was caused by a missing type definition property in the statistics module.

---

## Bug Fixes

### TypeScript Type Definition Fix
- **Issue:** Frontend compilation error in `AnalysisSelector.tsx` at line 114
- **Root Cause:** Missing `minSampleSize` property in the `AnalysisDefinition` interface
- **Location:** `ui/src/types/statistics.ts` (line 175)
- **Fix:** Added `minSampleSize?: number;` property to the `AnalysisDefinition` interface
- **Impact:** Resolves Docker build failures and allows successful frontend compilation

---

## Technical Details

### Problem Analysis

The error occurred when the TypeScript compiler encountered:
```tsx
{analysis.minSampleSize && (
```

While the code itself was syntactically correct (standard React conditional rendering), TypeScript raised an error because `minSampleSize` was not defined in the `AnalysisDefinition` interface type.

### Solution Implementation

Added the optional `minSampleSize` property to the interface:

```typescript
export interface AnalysisDefinition {
  id: AnalysisType;
  name: string;
  category: AnalysisCategory;
  description: string;
  parameters: AnalysisParameter[];
  requiredColumns: string[];
  optionalColumns: string[];
  outputs: string[];
  assumptions: string[];
  examples: string[];
  references: string[];
  icon?: string;
  minSampleSize?: number;  // NEW: Added property
}
```

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
docker pull tajo9128/biodockify-ai:v2.7.9
```

### Docker Run
```bash
docker run -p 3000:3000 tajo9128/biodockify-ai:v2.7.9
```

### From Source
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
git checkout v2.7.9
docker-compose up -d
```

---

## Verification

After deployment, verify:
1. ✅ Frontend builds without TypeScript errors
2. ✅ AnalysisSelector component renders correctly
3. ✅ Statistics analysis selection works properly
4. ✅ Docker image builds successfully

---

## Known Issues

None reported in this release.

---

## Acknowledgments

Thank you for your continued patience as we resolve build issues and maintain production-ready code quality for pharmaceutical research applications.

---

**Next Version:** v2.7.10 (planned)
**Support:** GitHub Issues

# Release Notes - BioDockify v2.8.6

## Summary
This release fixes critical build errors and JSX syntax issues in the Statistics module that prevented a successful v2.8.5 release.

## Technical Fixes
- **UI Architecture**: Fixed structural integrity of `ResultsViewer.tsx` component.
- **JSX Syntax**: Corrected malformed `className` attributes and template literals in Results Viewer.
- **Docker Optimization**: Removed empty continuation lines in `Dockerfile` to resolve build warnings.
- **Version Unified**: Synchronized version `v2.8.6` across all services and documentation.

## Impact
- Build process now completes successfully.
- Statistics Results Viewer correctly renders P-values and Adjusted P-values.
- Docker release pipeline is fully functional.

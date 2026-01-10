#!/bin/bash

echo "🧹 Running pre-push cleanup..."

# Remove macOS artifacts
echo "  Removing macOS artifacts..."
find . -name "__MACOSX" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "._*" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Remove backup files
echo "  Removing backup files..."
find . -name "*_backup.*" -type f -delete 2>/dev/null || true
find . -name "*.backup" -type f -delete 2>/dev/null || true

# Remove temp files
echo "  Removing temporary files..."
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.temp" -type f -delete 2>/dev/null || true
find . -name "RELEASE_NOTES_TEMP*.md" -type f -delete 2>/dev/null || true
find . -name "workspace-*.tar" -type f -delete 2>/dev/null || true

echo "✅ Cleanup complete"

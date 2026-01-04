#!/bin/bash

# BioDockify AI - Production Build Script
# Handles all steps for creating production-ready Tauri application

set -e  # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

echo "🏗️ BioDockify AI - Production Build"
echo "=========================================="
echo ""

# Clean previous builds
print_info "Cleaning previous builds..."
rm -rf .next
rm -rf desktop/src-tauri/target
print_success "Clean completed"

# Build Next.js
print_info "Building Next.js for production..."
if bun run build; then
    print_success "Next.js build completed"
else
    print_error "Next.js build failed - check the logs above"
    exit 1
fi

# Ensure dist directory structure is correct
print_info "Verifying build output..."
if [ ! -d ".next/standalone" ]; then
    print_error "Build output directory not found: .next/standalone"
    exit 1
fi

# Copy static files
print_info "Copying static files..."
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/
print_success "Static files copied"

# Copy Node modules (if needed)
if [ ! -d ".next/standalone/node_modules" ]; then
    print_info "Copying Node.js runtime files..."
    # Tauri may need specific node files
    # This depends on the specific build configuration
fi

# Build Tauri
print_info "Building Tauri application..."
cd desktop

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    print_error "Rust is not installed. Please install Rust toolchain first."
    echo "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Build Tauri in release mode
if bun run tauri:build; then
    print_success "Tauri build completed"
else
    print_error "Tauri build failed"
    exit 1
fi

# Check build output
print_info "Verifying Tauri build output..."
BUILD_DIR="desktop/src-tauri/target/release"

if [ -d "$BUILD_DIR" ]; then
    echo ""
    echo "📦 Build artifacts:"
    ls -lh "$BUILD_DIR"/
    echo ""
    
    # Check for specific platform bundles
    if [ -d "$BUILD_DIR/bundle" ]; then
        print_success "Bundle directory exists"
        ls -lh "$BUILD_DIR/bundle"/
    fi
else
    print_error "Build output directory not found: $BUILD_DIR"
    exit 1
fi

echo ""
echo "=========================================="
print_success "Production build completed!"
echo ""
echo "📦 Distribution files:"
echo ""
echo "Windows: desktop/src-tauri/target/release/bundle/nsis/biodockify-ai_1.0.0_x64_en-US.NSIS"
echo "macOS:   desktop/src-tauri/target/release/bundle/dmg/BioDockify AI_1.0.0_x64.dmg"
echo "Linux:   desktop/src-tauri/target/release/bundle/appimage/biodockify-ai_1.0.0_amd64.AppImage"
echo ""
echo "📝 Create tar archive:"
echo "   bun run tar"
echo ""
echo "🔍 For debugging:"
echo "   bun run tauri:build --verbose"
echo "=========================================="

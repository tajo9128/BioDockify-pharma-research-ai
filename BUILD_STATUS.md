# BioDockify Build Status

## Current Issue

The NSIS installer build failed because the required executable files are missing:

### Missing Files

1. **`desktop/tauri/src-tauri/target/release/BioDockify.exe`** - Main Tauri desktop application
2. **`desktop/tauri/src-tauri/biodockify-engine-x86_64-pc-windows-msvc.exe`** - Python backend engine

### Root Cause

These files are created during the build process, but the build process cannot run locally because the required development tools are not installed:

- ❌ Python with PyInstaller
- ❌ Node.js and npm
- ❌ Rust/Cargo
- ✅ NSIS (installed at `C:\Program Files (x86)\NSIS`)

## Solution Options

### Option 1: Install Build Tools Locally (Recommended for Development)

Follow the steps in [`BUILD_GUIDE.md`](BUILD_GUIDE.md) to install the required tools and build locally:

1. Install Python 3.10+ from https://www.python.org/downloads/
2. Install Node.js LTS from https://nodejs.org/
3. Install Rust from https://www.rust-lang.org/tools/install
4. Run the automated build script: `build_all.bat`

**Estimated time:** 30-45 minutes for first-time setup, 10-20 minutes for subsequent builds.

### Option 2: Use GitHub Actions CI/CD (Recommended for Releases)

The project has a complete GitHub Actions workflow that builds the application automatically:

1. Tag your commit: `git tag v2.16.4`
2. Push the tag: `git push origin v2.16.4`
3. GitHub Actions will build and create release assets automatically

**Benefits:**
- No local tool installation required
- Consistent build environment
- Automated testing and validation
- Automatic release asset generation

See [`.github/workflows/release.yml`](.github/workflows/release.yml) for the complete workflow.

### Option 3: Download Pre-built Release (If Available)

If a release has already been created through GitHub Actions, you can download the installer from the GitHub Releases page:

1. Go to: https://github.com/[your-username]/BioDockify-pharma-research-ai/releases
2. Download `BioDockify_Setup_v2.16.4.exe`
3. Run the installer to install BioDockify

## Build Process Overview

The complete build process consists of 9 steps:

```
1. Install Python dependencies
   ↓
2. Build Python backend with PyInstaller
   Creates: binaries/biodockify-engine.exe (~50-100MB)
   ↓
3. Move backend to Tauri directory
   Target: desktop/tauri/src-tauri/biodockify-engine-x86_64-pc-windows-msvc.exe
   ↓
4. Build frontend with npm
   Creates: ui/out/index.html and assets
   ↓
5. Copy frontend to Tauri
   Target: desktop/tauri/dist/
   ↓
6. Generate icons
   Creates: Various icon formats in desktop/tauri/src-tauri/icons/
   ↓
7. Install Tauri dependencies
   ↓
8. Build Tauri desktop app
   Creates: desktop/tauri/src-tauri/target/release/BioDockify.exe (~20-50MB)
   ↓
9. Build NSIS installer
   Creates: installer/BioDockify_Setup_v2.16.4.exe
```

## Quick Start

If you want to build locally right now:

```cmd
REM Navigate to project directory
cd BioDockify-pharma-research-ai

REM Run the automated build script
build_all.bat
```

The script will check for prerequisites and guide you through the installation process if any tools are missing.

## Verification

After a successful build, verify the following files exist:

```cmd
REM Check backend
dir binaries\biodockify-engine.exe

REM Check Tauri backend
dir desktop\tauri\src-tauri\biodockify-engine-x86_64-pc-windows-msvc.exe

REM Check Tauri app
dir desktop\tauri\src-tauri\target\release\BioDockify.exe

REM Check installer
dir installer\BioDockify_Setup_v2.16.4.exe
```

## Troubleshooting

### "Python not found"
Install Python 3.10+ from https://www.python.org/downloads/
Make sure to check "Add Python to PATH" during installation.

### "Node.js not found"
Install Node.js LTS from https://nodejs.org/

### "Rust/Cargo not found"
Install Rust from https://www.rust-lang.org/tools/install

### "NSIS not found"
Install NSIS from https://nsis.sourceforge.io/Download

### PyInstaller fails with TensorFlow errors
```cmd
pip install --upgrade tensorflow==2.15.0
```

### Tauri build fails
Ensure Visual Studio Build Tools are installed for Windows:
https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

## Additional Resources

- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Detailed build instructions
- [biodockify.spec](biodockify.spec) - PyInstaller configuration
- [installer/setup.nsi](installer/setup.nsi) - NSIS installer script
- [desktop/tauri/src-tauri/Cargo.toml](desktop/tauri/src-tauri/Cargo.toml) - Rust/Tauri configuration
- [.github/workflows/release.yml](.github/workflows/release.yml) - GitHub Actions workflow

## Next Steps

Choose one of the following:

1. **For local development:** Install the required tools and run `build_all.bat`
2. **For releases:** Use GitHub Actions by tagging and pushing a version tag
3. **For testing:** Download a pre-built release from GitHub Releases (if available)

For questions or issues, refer to the troubleshooting section or check the detailed BUILD_GUIDE.md.

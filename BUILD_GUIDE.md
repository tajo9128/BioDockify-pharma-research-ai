# BioDockify Build Guide

## Prerequisites

Before building BioDockify, ensure you have the following tools installed:

### Required Tools

1. **Python 3.10+**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Node.js (LTS version)**
   - Download from: https://nodejs.org/
   - npm is included with Node.js

3. **Rust and Cargo**
   - Download from: https://www.rust-lang.org/tools/install
   - Run: `rustup default stable`

4. **NSIS (Nullsoft Scriptable Install System)**
   - Download from: https://nsis.sourceforge.io/Download
   - Install to default location: `C:\Program Files (x86)\NSIS`

5. **Docker Desktop** (for runtime, not build)
   - Download from: https://www.docker.com/products/docker-desktop/

### Verifying Installation

Open a new terminal and verify each tool:

```cmd
python --version
pip --version
node --version
npm --version
cargo --version
rustc --version
```

## Build Process

### Step 1: Install Python Dependencies

```cmd
cd BioDockify-pharma-research-ai
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller pyyaml
```

### Step 2: Build Python Backend

```cmd
python -m PyInstaller biodockify.spec --distpath binaries --clean --noconfirm
```

This creates `binaries/biodockify-engine.exe` (should be >50MB)

### Step 3: Prepare Tauri Binaries

```cmd
Move-Item -Path "binaries\biodockify-engine.exe" -Destination "desktop\tauri\src-tauri\biodockify-engine-x86_64-pc-windows-msvc.exe" -Force
```

### Step 4: Build Frontend

```cmd
cd ui
npm install
npx prisma generate
npm run build
```

This creates `ui/out/index.html`

### Step 5: Copy Frontend to Tauri

```cmd
cd ..
New-Item -ItemType Directory -Force -Path "desktop\tauri\dist"
Copy-Item -Path "ui\out\*" -Destination "desktop\tauri\dist" -Recurse -Force
```

### Step 6: Generate Icons

```cmd
cd desktop\tauri\src-tauri
npx @tauri-apps/cli icon icons/icon.png --output icons
cd ..\..\..
```

### Step 7: Install Tauri Dependencies

```cmd
cd desktop\tauri
npm install
```

### Step 8: Build Tauri Desktop App

```cmd
npm run tauri build -- --verbose --config src-tauri/tauri.conf.json
```

This creates `desktop\tauri\src-tauri\target\release\BioDockify.exe`

### Step 9: Build NSIS Installer

```cmd
cd ..\..
"C:\Program Files (x86)\NSIS\makensis.exe" installer\setup.nsi
```

This creates `installer\BioDockify_Setup_v2.16.4.exe`

## Automated Build Script

Save the following as `build_all.bat` and run it from the project root:

```batch
@echo off
echo ========================================
echo BioDockify Automated Build Script
echo ========================================
echo.

REM Check prerequisites
echo [1/9] Checking prerequisites...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js LTS
    pause
    exit /b 1
)

cargo --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust/Cargo not found. Please install Rust
    pause
    exit /b 1
)

if not exist "C:\Program Files (x86)\NSIS\makensis.exe" (
    echo ERROR: NSIS not found. Please install NSIS
    pause
    exit /b 1
)

echo All prerequisites found!
echo.

REM Install Python dependencies
echo [2/9] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller pyyaml
echo.

REM Build Python backend
echo [3/9] Building Python backend...
python -m PyInstaller biodockify.spec --distpath binaries --clean --noconfirm
if errorlevel 1 (
    echo ERROR: PyInstaller build failed
    pause
    exit /b 1
)
echo Backend built successfully!
echo.

REM Prepare Tauri binaries
echo [4/9] Preparing Tauri binaries...
if exist "binaries\biodockify-engine.exe" (
    Move-Item -Path "binaries\biodockify-engine.exe" -Destination "desktop\tauri\src-tauri\biodockify-engine-x86_64-pc-windows-msvc.exe" -Force
    echo Backend executable moved to Tauri directory
) else (
    echo ERROR: Backend executable not found
    pause
    exit /b 1
)
echo.

REM Build frontend
echo [5/9] Building frontend...
cd ui
call npm install
if errorlevel 1 (
    cd ..
    echo ERROR: npm install failed
    pause
    exit /b 1
)

call npx prisma generate
if errorlevel 1 (
    cd ..
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    cd ..
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

if not exist "out\index.html" (
    cd ..
    echo ERROR: Frontend build output not found
    pause
    exit /b 1
)
echo Frontend built successfully!
cd ..
echo.

REM Copy frontend to Tauri
echo [6/9] Copying frontend to Tauri...
New-Item -ItemType Directory -Force -Path "desktop\tauri\dist"
Copy-Item -Path "ui\out\*" -Destination "desktop\tauri\dist" -Recurse -Force
echo Frontend copied successfully!
echo.

REM Generate icons
echo [7/9] Generating icons...
cd desktop\tauri\src-tauri
call npx @tauri-apps/cli icon icons/icon.png --output icons
cd ..\..\..
echo Icons generated successfully!
echo.

REM Install Tauri dependencies
echo [8/9] Installing Tauri dependencies...
cd desktop\tauri
call npm install
if errorlevel 1 (
    cd ..
    echo ERROR: Tauri npm install failed
    pause
    exit /b 1
)
echo.

REM Build Tauri desktop app
echo Building Tauri desktop app (this may take 10-20 minutes)...
call npm run tauri build -- --verbose --config src-tauri/tauri.conf.json
if errorlevel 1 (
    cd ..
    echo ERROR: Tauri build failed
    pause
    exit /b 1
)

if not exist "src-tauri\target\release\BioDockify.exe" (
    cd ..
    echo ERROR: Tauri executable not found
    pause
    exit /b 1
)
echo Tauri app built successfully!
cd ..
echo.

REM Build NSIS installer
echo [9/9] Building NSIS installer...
"C:\Program Files (x86)\NSIS\makensis.exe" installer\setup.nsi
if errorlevel 1 (
    echo ERROR: NSIS build failed
    pause
    exit /b 1
)

if not exist "installer\BioDockify_Setup_v2.16.4.exe" (
    echo ERROR: Installer not found
    pause
    exit /b 1
)
echo.

echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Installer location: installer\BioDockify_Setup_v2.16.4.exe
echo.
echo You can now distribute this installer to users.
echo.
pause
```

## Troubleshooting

### Python Build Issues

If PyInstaller fails with TensorFlow errors:
```cmd
pip install --upgrade tensorflow==2.15.0
```

### Frontend Build Issues

If npm install fails:
```cmd
cd ui
rm -rf node_modules package-lock.json
npm install
```

### Tauri Build Issues

If Tauri build fails, ensure:
1. Rust toolchain is up to date: `rustup update`
2. Visual Studio Build Tools are installed (for Windows)
3. WebView2 is installed (comes with Windows 10/11)

### NSIS Build Issues

If NSIS fails, verify:
1. NSIS is installed to `C:\Program Files (x86)\NSIS`
2. The executable paths in `installer/setup.nsi` are correct
3. All required files exist before building

## CI/CD Alternative

The recommended way to build releases is through GitHub Actions. The workflow file [`.github/workflows/release.yml`](.github/workflows/release.yml) contains the complete automated build process that runs on Windows runners with all dependencies pre-installed.

To create a release:
1. Tag your commit: `git tag v2.16.4`
2. Push the tag: `git push origin v2.16.4`
3. GitHub Actions will automatically build and create release assets

## Output Files

After successful build, you'll have:

- `binaries/biodockify-engine.exe` - Python backend (~50-100MB)
- `desktop/tauri/src-tauri/target/release/BioDockify.exe` - Main desktop app (~20-50MB)
- `desktop/tauri/src-tauri/target/release/bundle/nsis/*.exe` - Tauri NSIS installer
- `installer/BioDockify_Setup_v2.16.4.exe` - Custom NSIS installer (recommended for distribution)

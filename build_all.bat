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
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js LTS
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

cargo --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust/Cargo not found. Please install Rust
    echo Download from: https://www.rust-lang.org/tools/install
    pause
    exit /b 1
)

if not exist "C:\Program Files (x86)\NSIS\makensis.exe" (
    echo ERROR: NSIS not found. Please install NSIS
    echo Download from: https://nsis.sourceforge.io/Download
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

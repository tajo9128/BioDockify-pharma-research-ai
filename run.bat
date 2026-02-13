@echo off
setlocal

:: BioDockify One-Click Launcher (Windows)
:: Full Stack Edition - "Robust Agent Zero Experience"

echo ========================================================
echo   BioDockify AI - Pharma Research Station
echo   Version: 2.6.7 (Full Stack + LM Studio Ready)
echo ========================================================
echo.

:: 1. Stop existing containers (if any)
echo [INFO] Cleaning up old containers...
docker stop biodockify >nul 2>&1
docker rm biodockify >nul 2>&1
docker compose down --remove-orphans >nul 2>&1
echo [OK] Environment clean.

:: 2. Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is NOT running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo [OK] Docker is running.

:: 3. Launch Full Stack with Docker Compose
echo [INFO] Orchestrating BioDockify Ecosystem...
echo.
echo     Core App:   Port 3000
echo     Database:   PostgreSQL + ChromaDB
echo     AI Engine:  LM Studio (On Host: Port 1234)
echo     PDF Parser: Grobid
echo.
echo [NOTE] Please ensure LM Studio is running on your machine with the local server enabled on port 1234.

docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services.
    echo Please check if ports 3000, 7474, or 8070 are in use.
    pause
    exit /b 1
)

:: 4. Open in browser
echo.
echo [SUCCESS] BioDockify Ecosystem is live!
echo Opening http://localhost:3000 ...
start http://localhost:3000

:: Keep window open for a moment
timeout /t 5

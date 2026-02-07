@echo off
TITLE BioDockify Research Backend
COLOR 0A

echo ====================================================
echo    BioDockify Pharma Research AI - Backend Boot
echo ====================================================

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found! Please install Python 3.10+
    pause
    exit /b 1
)

:: 2. Check Virtual Env (Optional - skipping for simple desktop setup)
:: echo Checking environment...

:: 3. Install/Update Dependencies
echo [+] Verifying dependencies...
IF EXIST "requirements.txt" (
    pip install -r requirements.txt
) ELSE IF EXIST "api\requirements.txt" (
    pip install -r api\requirements.txt
) ELSE (
    echo [WARNING] requirements.txt not found in root or api/. Skipping automated check.
)
IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Dependency check failed or some packages missed. Trying to proceed...
)

:: 4. Start Docker (Optional)
:: docker compose up -d

:: 5. Launch FastAPI
echo.
echo [+] Starting API Server...
echo    Port: 8000
echo    Docs: http://localhost:8000/docs
echo.
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload

pause

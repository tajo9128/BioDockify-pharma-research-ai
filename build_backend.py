import PyInstaller.__main__
import os
import shutil

# Define build parameters
ENTRY_POINT = "server.py"
EXECUTABLE_NAME = "biodockify-engine"
DIST_DIR = "binaries"

# Cleanup previous builds
if os.path.exists(DIST_DIR):
    shutil.rmtree(DIST_DIR)
if os.path.exists("build"):
    shutil.rmtree("build")

print(f"Building {EXECUTABLE_NAME} from {ENTRY_POINT}...")

PyInstaller.__main__.run([
    ENTRY_POINT,
    '--name=%s' % EXECUTABLE_NAME,
    '--onefile',
    '--distpath=%s' % DIST_DIR,
    '--clean',
    
    # Hidden imports for critical libraries
    '--hidden-import=uvicorn.logging',
    '--hidden-import=uvicorn.loops',
    '--hidden-import=uvicorn.loops.auto',
    '--hidden-import=uvicorn.protocols',
    '--hidden-import=uvicorn.protocols.http',
    '--hidden-import=uvicorn.protocols.http.auto',
    '--hidden-import=uvicorn.lifespan',
    '--hidden-import=uvicorn.lifespan.on',
    
    '--hidden-import=fastapi',
    '--hidden-import=pydantic',
    '--hidden-import=requests',
    
    # Include source directories
    '--add-data=api;api',
    '--add-data=agent_zero;agent_zero',
    '--add-data=modules;modules',
    '--add-data=nlp;nlp',
    '--add-data=orchestration;orchestration',
    '--add-data=export;export',
    
    # Exclude heavy unnecessary things if possible
    '--exclude-module=tkinter',
])

print(f"Build complete! Executable is in {DIST_DIR}/{EXECUTABLE_NAME}.exe")

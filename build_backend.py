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
    '--collect-all=uvicorn',
    '--collect-all=fastapi',
    '--collect-all=pydantic',
    '--collect-all=requests',
    
    # HEAVY Dependencies (Validation & Molecular Vision)
    '--collect-all=tensorflow',
    '--collect-all=numpy',
    '--collect-all=PIL',
    # Note: DECIMER might be named differently in site-packages, checking standard naming
    '--hidden-import=DECIMER', 
    
    # Graph Database
    '--hidden-import=neo4j',
    
    # PDF Processing
    '--hidden-import=pypdf',
    '--hidden-import=pdfminer',

    # Include source directories
    '--add-data=api;api',
    '--add-data=agent_zero;agent_zero',
    '--add-data=modules;modules',
    '--add-data=nlp;nlp',
    '--add-data=orchestration;orchestration',
    '--add-data=export;export',
    
    # Exclude GUI libs we definitely don't need
    '--exclude-module=tkinter',
    '--exclude-module=matplotlib',
    '--exclude-module=PyQt5',
])

print(f"Build complete! Executable is in {DIST_DIR}/{EXECUTABLE_NAME}.exe")

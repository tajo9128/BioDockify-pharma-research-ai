#!/usr/bin/env python3
import uvicorn
import os
import sys

# Add the current directory to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# EXPLICIT IMPORTS TO FORCE PYINSTALLER BUNDLING
# We remove try/except to force PyInstaller to see these as hard dependencies.
import tensorflow as tf
import numpy as np
import PIL
import neo4j
import pypdf
import pdfminer

# Hint for DECIMER if available, but it might be a sub-module.
try:
    import DECIMER
except ImportError:
    pass

from api.main import app

def main():
    # Dummy usage to trick PyInstaller static analysis into keeping these libs
    try:
        print(f"Initializing AI Engine with TF {tf.__version__}, NumPy {np.__version__}")
    except:
        pass

    print("Starting BioDockify AI Engine on port 8000...")
    # Bind to localhost 8000
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import uvicorn
import os
import sys

# Add the current directory to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- PROTECTIVE STARTUP CHECKS ---
import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

REQUIRED_ENV = [
    # "NEO4J_URI", "NEO4J_USER", "NEO4J_PASS",  # Uncomment if Neo4j is critical for startup
    # "OLLAMA_HOST" # Uncomment if Ollama is critical
]

# Check for .env file and load it if python-dotenv is available (optional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

missing = [v for v in REQUIRED_ENV if not os.getenv(v)]
if missing:
    logging.warning("⚠️  Startup Warning: Missing recommended environment variables: %s", ", ".join(missing))
    logging.info("Continuing start-up sequence...") 

# Check for critical dependencies before importing heavy libs
try:
    import tensorflow
except ImportError:
    logging.error("CRITICAL: TensorFlow not found. Please run 'pip install tensorflow'.")
    raise SystemExit(1)
# ---------------------------------


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

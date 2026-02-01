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
    # logging.error("Startup aborted...") # Uncomment to enforce fail-fast
    # raise SystemExit(1) 

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
import pypdf
import pdfminer

# Optional dependencies - these modules handle missing deps gracefully
try:
    import neo4j
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.info("Neo4j not installed - graph features will operate in offline mode")

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

    print("Starting BioDockify AI Engine on port 8234...")
    # Bind to localhost 8234 (Matches Frontend)
    uvicorn.run(app, host="127.0.0.1", port=8234, log_level="info")

if __name__ == "__main__":
    main()

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
TF_AVAILABLE = False
try:
    import tensorflow
    TF_AVAILABLE = True
except ImportError:
    logging.warning("⚠️ TensorFlow not found. DECIMER/ML features will be disabled.")
    logging.warning("   Run 'pip install tensorflow' to enable full functionality.")
# ---------------------------------


# EXPLICIT IMPORTS FOR PYINSTALLER BUNDLING (graceful)
# We try/except to allow Docker startup even if some deps are missing
try:
    import tensorflow as tf
except ImportError:
    tf = None

try:
    import numpy as np
except ImportError:
    import logging
    logging.warning("NumPy not found")
    np = None

try:
    import PIL
except ImportError:
    PIL = None

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import pdfminer
except ImportError:
    pdfminer = None

# Optional dependencies - these modules handle missing deps gracefully
try:
    import neo4j
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.info("Neo4j not installed - graph features will operate in offline mode")

# Hint for DECIMER if available, but it might be a sub-module.
# We skip top-level import to avoid startup hangs due to heavy weights.
# The modules using it (like im2smiles) handle lazy loading internally.

from api.main import app

def main():
    # Dummy usage to trick PyInstaller static analysis into keeping these libs
    try:
        print(f"Initializing AI Engine with TF {tf.__version__}, NumPy {np.__version__}")
    except:
        pass

    # Bind to 0.0.0.0 (More robust for Windows/IPv6 resolution of localhost)
    uvicorn.run(app, host="0.0.0.0", port=8234, log_level="info")

if __name__ == "__main__":
    main()

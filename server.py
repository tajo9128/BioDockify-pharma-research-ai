#!/usr/bin/env python3
import uvicorn
import os
import sys

# Add the current directory to sys.path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.main import app

def main():
    print("Starting BioDockify AI Engine on port 8000...")
    # Bind to localhost 8000
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
BioDockify Environment Setup & Compatibility Check
Run this BEFORE installing requirements to verify your environment.

Usage:
    python check_environment.py
"""

import sys
import subprocess
import platform

# Required Python version range
MIN_PYTHON = (3, 10)
MAX_PYTHON = (3, 12)

def check_python_version():
    """Check if Python version is compatible."""
    current = sys.version_info[:2]
    
    print(f"\n{'='*60}")
    print("BioDockify Environment Check")
    print(f"{'='*60}\n")
    
    print(f"Current Python: {platform.python_version()}")
    print(f"Required: Python 3.10 - 3.12 (Recommended: 3.11.x)")
    print(f"Platform: {platform.system()} {platform.machine()}")
    print()
    
    if current < MIN_PYTHON:
        print(f"[FAIL] Python {current[0]}.{current[1]} is too OLD.")
        print(f"       Please upgrade to Python 3.11.x")
        return False
    elif current > MAX_PYTHON:
        print(f"[FAIL] Python {current[0]}.{current[1]} is NOT SUPPORTED.")
        print(f"       TensorFlow 2.15 does not support Python 3.13+")
        print()
        print("       SOLUTION:")
        print("       1. Download Python 3.11.x from https://python.org/downloads/")
        print("       2. Create a new virtual environment:")
        print("          py -3.11 -m venv .venv")
        print("          .venv\\Scripts\\activate")
        print("       3. Then run: pip install -r requirements.txt")
        return False
    else:
        print(f"[PASS] Python {current[0]}.{current[1]} is compatible!")
        return True

def check_key_packages():
    """Check if problematic packages are installed with wrong versions."""
    issues = []
    
    # Check NumPy
    try:
        import numpy as np
        version = tuple(map(int, np.__version__.split('.')[:2]))
        if version >= (2, 0):
            issues.append(f"NumPy {np.__version__} installed (needs <2.0.0)")
    except ImportError:
        pass
    
    # Check TensorFlow
    try:
        import tensorflow as tf
        version = tf.__version__
        if not version.startswith("2.15"):
            issues.append(f"TensorFlow {version} installed (needs 2.15.x)")
    except ImportError:
        pass
    except Exception as e:
        issues.append(f"TensorFlow import error: {e}")
    
    # Check OpenCV
    try:
        import cv2
        version = cv2.__version__
        major_minor = tuple(map(int, version.split('.')[:2]))
        if major_minor >= (4, 11):
            issues.append(f"OpenCV {version} installed (needs <4.11.0)")
    except ImportError:
        pass
    
    if issues:
        print("\n[WARN] Package Version Issues Detected:")
        for issue in issues:
            print(f"       - {issue}")
        print("\n       SOLUTION: Clean reinstall in a fresh virtual environment:")
        print("       pip uninstall -y numpy tensorflow opencv-python-headless")
        print("       pip install -r requirements.txt")
        return False
    
    return True

def main():
    python_ok = check_python_version()
    
    if python_ok:
        packages_ok = check_key_packages()
        
        if packages_ok:
            print("\n[PASS] Environment looks good! You can proceed with:")
            print("       pip install -r requirements.txt")
        else:
            print("\n[WARN] Fix the package issues above before running BioDockify.")
    else:
        print("\n[FAIL] Please fix Python version first!")
    
    print()
    return 0 if python_ok else 1

if __name__ == "__main__":
    sys.exit(main())

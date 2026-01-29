
import sys
import platform

print(f"Python: {sys.version}")
print(f"Platform: {platform.platform()}")

print("\n--- Testing Imports ---")

try:
    import numpy
    print(f"[PASS] NumPy: {numpy.__version__}")
except ImportError as e:
    print(f"[FAIL] NumPy: FAIL - {e}")

try:
    import pandas
    print(f"[PASS] Pandas: {pandas.__version__}")
except ImportError as e:
    print(f"[FAIL] Pandas: FAIL - {e}")

try:
    import cv2
    print(f"[PASS] OpenCV: {cv2.__version__}")
except ImportError as e:
    print(f"[FAIL] OpenCV: FAIL - {e}")

print("\n--- Testing Critical ML Imports (May take a moment) ---")

try:
    import tensorflow as tf
    print(f"[PASS] TensorFlow: {tf.__version__}")
except ImportError as e:
    print(f"[FAIL] TensorFlow: FAIL - {e}")

try:
    from DECIMER import predict_SMILES
    print(f"[PASS] DECIMER: Loaded successfully")
except ImportError as e:
    print(f"[FAIL] DECIMER: FAIL - {e}")

print("\n--- Smoke Test Complete ---")

import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Current Working Directory: {os.getcwd()}")
print("\nsys.path:")
for p in sys.path:
    print(f"  - {p}")

print("\nEnvironment Variables:")
for key in ['PYTHONHOME', 'PYTHONPATH', 'PATH']:
    print(f"  {key}: {os.environ.get(key, 'Not Set')}")

try:
    import encodings
    print("\nSuccessfully imported 'encodings'")
except ImportError as e:
    print(f"\nFAILED to import 'encodings': {e}")

try:
    import autogen
    print("Successfully imported 'autogen'")
except ImportError:
    print("Could not import 'autogen' (Expected if not installed)")

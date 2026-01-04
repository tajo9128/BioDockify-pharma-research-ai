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

print(f"Building {EXECUTABLE_NAME} from SPEC FILE...")

# Run PyInstaller with the Spec file
# This is much more reliable than CLI args for complex deps
PyInstaller.__main__.run([
    'biodockify.spec',
    '--distpath=%s' % DIST_DIR,
    '--clean'
])

print(f"Build complete! Executable is in {DIST_DIR}/{EXECUTABLE_NAME}.exe")

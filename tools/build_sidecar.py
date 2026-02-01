import os
import shutil
import subprocess
import sys

def build_sidecar():
    print("[INFO] Starting Sidecar Build Process...")
    
    # 1. Define paths
    base_dir = os.getcwd()
    spec_file = os.path.join(base_dir, "biodockify.spec")
    
    # Tauri specific binary path
    # NOTE: Tauri bundles look for binaries in `src-tauri/bin`, NOT `src-tauri/binaries`
    # references in tauri.conf.json `externalBin` are relative to `src-tauri/bin` (implied)
    tauri_bin_dir = os.path.join(base_dir, "desktop", "tauri", "src-tauri", "bin")
    
    # Dist dir (PyInstaller default)
    dist_dir = os.path.join(base_dir, "dist")
    
    # Ensure target directory exists
    os.makedirs(tauri_bin_dir, exist_ok=True)
    
    # Platform specific suffix
    # Windows: x86_64-pc-windows-msvc.exe
    # We must match the target triple of the host
    target_name = "biodockify-engine-x86_64-pc-windows-msvc.exe"
    
    print(f"[INFO] Base Dir: {base_dir}")
    print(f"[INFO] Spec File: {spec_file}")
    print(f"[INFO] Target Binary: {os.path.join(tauri_bin_dir, target_name)}")

    if not os.path.exists(spec_file):
        print(f"[ERROR] Spec file not found at {spec_file}")
        return

    # 2. Run PyInstaller
    # We use the spec file derived from previous analysis
    cmd = [
        "pyinstaller",
        "--clean",
        "--noconfirm",
        "--distpath", dist_dir,
        "--workpath", "build",
        spec_file
    ]
    
    print(f"[INFO] Running PyInstaller: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] PyInstaller Failed: {e}")
        return

    # 3. Move and Rename
    # The spec file names the executable 'biodockify-engine'
    built_exe = os.path.join(dist_dir, "biodockify-engine.exe") # Windows adds .exe
    dest_exe = os.path.join(tauri_bin_dir, target_name)
    
    if os.path.exists(built_exe):
        print(f"[INFO] Moving {built_exe} -> {dest_exe}")
        shutil.copy2(built_exe, dest_exe)
        print("[SUCCESS] Sidecar Build Complete!")
    else:
        print(f"[ERROR] Compiled executable not found at {built_exe}")
        # List contents of dist just in case
        if os.path.exists(dist_dir):
            print(f"   Contents of {dist_dir}: {os.listdir(dist_dir)}")

if __name__ == "__main__":
    # Check for PyInstaller
    try:
        import PyInstaller
    except ImportError:
        print("[WARN] PyInstaller not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        
    build_sidecar()

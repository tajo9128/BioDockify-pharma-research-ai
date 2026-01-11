import os
import shutil
import subprocess
import sys
import platform

def package_backend():
    print("📦 Starting Backend Packaging Process...")
    
    # 1. Define paths
    base_dir = os.getcwd()
    api_entry = os.path.join(base_dir, "api", "main.py")
    dist_dir = os.path.join(base_dir, "dist")
    
    # Tauri specific binary path
    tauri_bin_dir = os.path.join(base_dir, "desktop", "tauri", "src-tauri", "binaries")
    os.makedirs(tauri_bin_dir, exist_ok=True)
    
    # Platform specific suffix
    # Windows: x86_64-pc-windows-msvc.exe
    target_name = "biodockify-engine-x86_64-pc-windows-msvc.exe"
    
    print(f"📍 Base Dir: {base_dir}")
    print(f"🎯 Target Binary: {os.path.join(tauri_bin_dir, target_name)}")

    # 2. PyInstaller Command
    # We need to include the 'data' directory for journal lists and 'modules'
    cmd = [
        "pyinstaller",
        "--clean",
        "--noconfirm",
        "--onefile",
        "--name", "biodockify-engine",
        "--add-data", f"data{os.pathsep}data",  # Include data folder
        "--paths", ".", # Add current dir to path to find modules
        api_entry
    ]
    
    print(f"🔨 Running PyInstaller: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd, shell=True) # shell=True often needed on Windows for path resolution
    except subprocess.CalledProcessError as e:
        print(f"❌ PyInstaller Failed: {e}")
        return

    # 3. Move and Rename
    built_exe = os.path.join(dist_dir, "biodockify-engine.exe")
    dest_exe = os.path.join(tauri_bin_dir, target_name)
    
    if os.path.exists(built_exe):
        print(f"🚚 Moving {built_exe} -> {dest_exe}")
        shutil.copy2(built_exe, dest_exe)
        print("✅ Backend Packaging Complete!")
    else:
        print(f"❌ Error: Compiled executable not found at {built_exe}")

if __name__ == "__main__":
    # Check for PyInstaller
    try:
        import PyInstaller
    except ImportError:
        print("⚠️ PyInstaller not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        
    package_backend()

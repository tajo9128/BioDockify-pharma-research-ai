# -*- mode: python ; coding: utf-8 -*-
import sys
import os
import importlib.util
from PyInstaller.utils.hooks import collect_all
from PyInstaller.building.datastruct import Tree
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT

block_cipher = None

print("DEBUG: Starting Robust Spec File Execution")

# --- HELPER: ROBUST COLLECTOR ---
def robust_collect(name):
    print(f"DEBUG: Processing '{name}'...")
    
    # 1. Try Hook (most reliable)
    d, b, h = collect_all(name)
    if d or b:
        print(f"  -> 'collect_all' succeeded (Datas: {len(d)})")
        return d, b, h
    
    # 2. Manual collection - walk directory and create proper (src, dest) tuples
    def collect_package_data(package_path, package_name):
        """Walk package directory and return list of (src, dest) tuples."""
        datas = []
        for root, dirs, files in os.walk(package_path):
            # Skip __pycache__ and .pyc files
            dirs[:] = [d for d in dirs if d != '__pycache__']
            for f in files:
                if f.endswith('.pyc'):
                    continue
                src = os.path.join(root, f)
                # Calculate relative dest path
                rel_path = os.path.relpath(root, package_path)
                if rel_path == '.':
                    dest = package_name
                else:
                    dest = os.path.join(package_name, rel_path)
                datas.append((src, dest))
        return datas
    
    # 2a. Try importlib.util.find_spec
    try:
        spec = importlib.util.find_spec(name)
        if spec and spec.origin:
            path = os.path.dirname(spec.origin)
            if os.path.isdir(path):
                print(f"  -> Found via find_spec at '{path}'")
                return collect_package_data(path, name), [], [name]
    except Exception as e:
        print(f"  -> find_spec failed: {e}")

    # 2b. Brute Force Search in sys.path
    print(f"  -> Searching sys.path...")
    for p in sys.path:
        possible_path = os.path.join(p, name)
        if os.path.isdir(possible_path):
            print(f"  -> Found via Brute Force at '{possible_path}'")
            return collect_package_data(possible_path, name), [], [name]

    print(f"WARNING: Could not find '{name}' (non-fatal, continuing...)")
    return [], [], []

# --- COLLECT LIBS ---
# --- COLLECT LIBS ---
libs = [
    'tensorflow', 
    'numpy', 
    'PIL', 
    'uvicorn', 
    'fastapi', 
    'neo4j',
    'pypdf',
    'pdfminer',
    'decimer',
    'pandas',
    'scipy',
    'statsmodels'
]

final_datas = []
final_binaries = []
final_hidden = []

for lib in libs:
    d, b, h = robust_collect(lib)
    final_datas.extend(d)
    final_binaries.extend(b)
    final_hidden.extend(h)

# STRICT CHECK for TensorFlow (now a warning, not fatal)
tf_found = False
for item in final_datas:
    # Check if we have any data collection for tensorflow
    chk_str = str(item)
    if 'tensorflow' in chk_str:
        tf_found = True
        break

if not tf_found:
    print("WARNING: TensorFlow data NOT found in collected data. DECIMER features may not work.")
    print("Continuing build anyway (non-fatal warning)...")
else:
    print("DEBUG: TensorFlow appears to be present.")

# --- MANUAL SOURCE FOLDERS ---
manual_datas = [
    ('api', 'api'),
    ('agent_zero', 'agent_zero'),
    ('modules', 'modules'),
    ('nlp', 'nlp'),
    ('orchestration', 'orchestration'),
    ('export', 'export'),
    ('runtime', 'runtime')
]

# --- EXTENDED HIDDEN IMPORTS ---
# Explicitly force common missing modules for Data Science stack
extended_hidden_imports = [
    'uvicorn.loops.auto', 
    'uvicorn.protocols.http.auto', 
    'simple_websocket',
    'pandas._libs.tslibs.base',
    'pandas._libs.tslibs.np_datetime',
    'pandas._libs.tslibs.nattype',
    'pandas._libs.tslibs.timedeltas',
    'scipy.special.cython_special',
    'scipy.spatial.transform._rotation_groups',
    'sklearn.utils._cython_blas',
    'sklearn.neighbors._typedefs',
    'sklearn.neighbors._quad_tree',
    'sklearn.tree',
    'sklearn.tree._utils',
    'tensorflow.python.framework.dtypes',
    'tensorflow.python.keras.engine',
    'statsmodels.tsa.statespace._filters',
    'statsmodels.tsa.statespace._smoothers'
]

# --- ANALYSIS ---
a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=final_binaries,
    datas=final_datas + manual_datas,
    hiddenimports=final_hidden + extended_hidden_imports + ['multipart'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'PyQt5'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# --- BINARY PATCH ---
print("DEBUG: Checking for _pywrap_tensorflow_internal fix...")
for i in range(len(a.binaries)):
    dest, origin, kind = a.binaries[i]
    if '_pywrap_tensorflow_internal' in dest:
        if not dest.startswith('tensorflow'):
             print(f"DEBUG: Patching {dest} -> tensorflow.python.{dest}")
             a.binaries[i] = ('tensorflow.python.' + dest, origin, kind)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas, 
    [],
    name='biodockify-engine',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    # IMPORTANT: Disable UPX - it triggers antivirus false positives
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # Add version info to help antivirus trust the file
    version='version_info.txt',
    icon='desktop/tauri/src-tauri/icons/icon.ico',
)


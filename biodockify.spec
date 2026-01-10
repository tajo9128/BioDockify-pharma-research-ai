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
    
    # 1. Try Hook
    d, b, h = collect_all(name)
    if d or b:
        print(f"  -> 'collect_all' succeeded (Datas: {len(d)})")
        return d, b, h
    
    # 2. Try Manual Path Find via importlib util
    try:
        spec = importlib.util.find_spec(name)
        if spec and spec.origin:
             path = os.path.dirname(spec.origin)
             print(f"  -> Found via find_spec at '{path}'")
             return [Tree(path, prefix=name, excludes=['*.pyc', '__pycache__'])], [], [name]
    except Exception as e:
        print(f"  -> find_spec failed: {e}")

    # 3. Brute Force Search in sys.path
    print(f"  -> Searching sys.path: {sys.path}")
    for p in sys.path:
        possible_path = os.path.join(p, name)
        if os.path.isdir(possible_path):
             print(f"  -> Found via Brute Force at '{possible_path}'")
             return [Tree(possible_path, prefix=name, excludes=['*.pyc', '__pycache__'])], [], [name]

    print(f"CRITICAL: Could not find '{name}' anywhere!")
    return [], [], []

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
    'DECIMER'
]

final_datas = []
final_binaries = []
final_hidden = []

for lib in libs:
    d, b, h = robust_collect(lib)
    final_datas.extend(d)
    final_binaries.extend(b)
    final_hidden.extend(h)

# STRICT CHECK for TensorFlow
tf_found = False
for item in final_datas:
    # Check if we have any data collection for tensorflow
    chk_str = str(item)
    if 'tensorflow' in chk_str:
        tf_found = True
        break

if not tf_found:
    print("CRITICAL CHECK FAILED: TensorFlow data NOT found.")
    # We still raise error because we want 600MB build
    raise RuntimeError("TensorFlow bundling failed. Aborting.")
else:
    print("DEBUG: TensorFlow appears to be present.")

# --- MANUAL SOURCE FOLDERS ---
manual_datas = [
    ('api', 'api'),
    ('agent_zero', 'agent_zero'),
    ('modules', 'modules'),
    ('nlp', 'nlp'),
    ('orchestration', 'orchestration'),
    ('export', 'export')
]

# --- ANALYSIS ---
a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=final_binaries,
    datas=final_datas + manual_datas,
    hiddenimports=final_hidden + [
        'uvicorn.loops.auto', 
        'uvicorn.protocols.http.auto', 
        'simple_websocket',
        'tensorflow', 
        'numpy', 
        'neo4j', 
        'uvicorn', 
        'fastapi'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 
        'matplotlib', 
        'PyQt5',
        'tensorflow.python.keras.applications.*'
    ],
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
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

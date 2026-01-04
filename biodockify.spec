# -*- mode: python ; coding: utf-8 -*-
import sys
import os
import importlib
from PyInstaller.utils.hooks import collect_all
from PyInstaller.building.datastruct import Tree

block_cipher = None

print("DEBUG: Starting Hybrid Spec File Execution")

# --- HELPER: ROBUST COLLECTOR ---
def robust_collect(name):
    """
    Tries standard collect_all. 
    If that fails (returns empty), falls back to importing and Tree().
    Returns: (datas, binaries, hiddenimports)
    """
    print(f"DEBUG: Processing '{name}'...")
    
    # 1. Try Hook
    d, b, h = collect_all(name)
    if d or b:
        print(f"  -> 'collect_all' succeeded for '{name}' (Datas: {len(d)}, Binaries: {len(b)})")
        return d, b, h
    
    print(f"  -> WARNING: 'collect_all' returned nothing for '{name}'. Falling back to Import+Tree.")
    
    # 2. Try Import + Tree
    try:
        mod = importlib.import_module(name)
        if hasattr(mod, '__file__'):
            path = os.path.dirname(mod.__file__)
        else:
            path = os.path.dirname(mod.__path__[0])
            
        print(f"  -> Found '{name}' at '{path}'")
        
        # Create Tree
        # Tree returns a generic object that we can't easily merge into 'datas' lists nicely
        # without it being in the Analysis step or passed to EXE.
        # BUT, Analysis.datas accepts Tree objects? Let's check.
        # Actually, best to return it as a list of tuples? No, Tree is complex.
        # We will return a special flag or handle it outside.
        
        # Let's just return the Tree object in the 'datas' slot and hope Analysis flattens it
        # OR we handle it by appending to a.datas later.
        
        # We will return it as a Single-Item List containing the Tree
        t = Tree(path, prefix=name, excludes=['*.pyc', '__pycache__'])
        return [t], [], [name]
        
    except ImportError as e:
        print(f"  -> CRITICAL ERROR: Could not import '{name}' for fallback. Error: {e}")
        return [], [], []
    except Exception as e:
        print(f"  -> ERROR: tree fallback failed for '{name}': {e}")
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
# We check if we have ANY data for tensorflow
tf_found = False
for item in final_datas:
    # If it's a tuple (dest, src, type), check dest
    if isinstance(item, tuple) and 'tensorflow' in item[0]:
        tf_found = True
        break
    # If it's a Tree object, check its root/prefix
    if hasattr(item, 'root') and 'tensorflow' in str(item.root): # Tree object
        tf_found = True
        break
    # Check simple string match on object string representation
    if 'tensorflow' in str(item):
        tf_found = True
        break

if not tf_found:
    print("CRITICAL CHECK FAILED: TensorFlow data NOT found in final bundle list.")
    raise RuntimeError("TensorFlow bundling failed. Aborting.")
else:
    print("DEBUG: TensorFlow appears to be present in datas.")

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
        'simple_websocket'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'PyQt5'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# --- BINARY PATCH (If binaries were collected via hooks) ---
# If we used Trees, binaries are inside the Tree (as datas) and preserved.
# If we used hooks, binaries are in a.binaries and flattened.
print("DEBUG: Checking for _pywrap_tensorflow_internal fix...")
for i in range(len(a.binaries)):
    dest, origin, kind = a.binaries[i]
    if '_pywrap_tensorflow_internal' in dest:
        # Only patch if it doesn't already have the prefix
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

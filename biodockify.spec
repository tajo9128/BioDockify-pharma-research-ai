# -*- mode: python ; coding: utf-8 -*-
import sys
import os
from PyInstaller.utils.hooks import collect_all

block_cipher = None

print("DEBUG: Starting Spec File Execution")

# --- 1. COLLECT HEAVY DEPENDENCIES ---
# We use collect_all to get everything.
tf_datas, tf_binaries, tf_hiddenimports = collect_all('tensorflow')
np_datas, np_binaries, np_hiddenimports = collect_all('numpy')
pil_datas, pil_binaries, pil_hiddenimports = collect_all('PIL')
neo_datas, neo_binaries, neo_hiddenimports = collect_all('neo4j')
uv_datas, uv_binaries, uv_hiddenimports = collect_all('uvicorn')
fa_datas, fa_binaries, fa_hiddenimports = collect_all('fastapi')

# STRICT VALIDATION: If we didn't find TensorFlow, FAIL THE BUILD NOW.
# This prevents the "6.7MB empty executable" problem.
if not tf_datas and not tf_binaries:
    print("CRITICAL ERROR: 'collect_all' found NO TensorFlow files!")
    print("This means PyInstaller cannot see the tensorflow package.")
    print(f"PYTHONPATH: {sys.path}")
    raise RuntimeError("TensorFlow not found! Aborting build to prevent empty artifact.")

print(f"DEBUG: Found {len(tf_datas)} TF datas and {len(tf_binaries)} TF binaries")
print(f"DEBUG: Found {len(np_datas)} NumPy datas and {len(np_binaries)} NumPy binaries")

# Merge collected lists
all_datas = tf_datas + np_datas + pil_datas + neo_datas + uv_datas + fa_datas
all_binaries = tf_binaries + np_binaries + pil_binaries + neo_binaries + uv_binaries + fa_binaries
all_hidden = tf_hiddenimports + np_hiddenimports + pil_hiddenimports + neo_hiddenimports + uv_hiddenimports + fa_hiddenimports

# --- 2. MANUAL SOURCE FOLDERS ---
manual_datas = [
    ('api', 'api'),
    ('agent_zero', 'agent_zero'),
    ('modules', 'modules'),
    ('nlp', 'nlp'),
    ('orchestration', 'orchestration'),
    ('export', 'export')
]

# --- 3. ANALYSIS ---
a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=all_binaries,
    datas=all_datas + manual_datas,
    hiddenimports=all_hidden + [
        'tensorflow',
        'tensorflow.python',
        'tensorflow.python._pywrap_tensorflow_internal',
        'tensorflow.python.framework',
        'tensorflow.python.keras',
        'tensorflow.python.keras.utils',
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

# --- 4. FIX TENSORFLOW BINARY PLACEMENT (User Suggestion) ---
# This fixes the "DLL load failed" error often seen with TF in onefile mode
print("DEBUG: Applying TensorFlow Binary Fix...")
for i in range(len(a.binaries)):
    dest, origin, kind = a.binaries[i]
    if '_pywrap_tensorflow_internal' in dest:
        print(f"DEBUG: Fixing path for {dest}")
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

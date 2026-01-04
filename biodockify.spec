# -*- mode: python ; coding: utf-8 -*-
import sys
import os
import site
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# --- MANUALLY COLLECT HEAVY LIBRARIES ---
# We use collect_all to inspect the installed packages and get everything
# structure: (datas, binaries, hiddenimports)

# 1. TensorFlow
tf_datas, tf_binaries, tf_hiddenimports = collect_all('tensorflow')

# 2. NumPy
np_datas, np_binaries, np_hiddenimports = collect_all('numpy')

# 3. PIL (Pillow)
pil_datas, pil_binaries, pil_hiddenimports = collect_all('PIL')

# 4. Uvicorn/FastAPI
uv_datas, uv_binaries, uv_hiddenimports = collect_all('uvicorn')
fa_datas, fa_binaries, fa_hiddenimports = collect_all('fastapi')

# 5. Graph & PDF
neo_datas, neo_binaries, neo_hiddenimports = collect_all('neo4j')
pdf_datas, pdf_binaries, pdf_hiddenimports = collect_all('pypdf')

# Merge all collected dependencies
all_datas = tf_datas + np_datas + pil_datas + uv_datas + fa_datas + neo_datas + pdf_datas
all_binaries = tf_binaries + np_binaries + pil_binaries + uv_binaries + fa_binaries + neo_binaries + pdf_binaries
all_hidden = tf_hiddenimports + np_hiddenimports + pil_hiddenimports + uv_hiddenimports + fa_hiddenimports + neo_hiddenimports + pdf_hiddenimports

# Add Manual Source Folders
# Format: (path_on_disk, destination_in_exe)
manual_datas = [
    ('api', 'api'),
    ('agent_zero', 'agent_zero'),
    ('modules', 'modules'),
    ('nlp', 'nlp'),
    ('orchestration', 'orchestration'),
    ('export', 'export')
]

a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=all_binaries,
    datas=all_datas + manual_datas,
    hiddenimports=all_hidden + ['simple_websocket', 'uvicorn.loops.auto', 'uvicorn.protocols.http.auto'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'PyQt5'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
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

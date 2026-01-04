# -*- mode: python ; coding: utf-8 -*-
import sys
import os
import site
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# --- HELPER: FIND SITE-PACKAGES ---
site_packages = site.getsitepackages()[0]
print(f"DEBUG: Using site-packages at: {site_packages}")

def get_lib_tree(lib_name):
    """Returns a Tree object for a library in site-packages."""
    path = os.path.join(site_packages, lib_name)
    if not os.path.exists(path):
        print(f"WARNING: Library '{lib_name}' not found at {path}")
        # Try generic import to find path as fallback
        try:
            mod = __import__(lib_name)
            path = os.path.dirname(mod.__file__)
            print(f"DEBUG: Found '{lib_name}' via import at {path}")
        except Exception as e:
            print(f"ERROR: Could not find library '{lib_name}': {e}")
            return None
            
    print(f"DEBUG: Bundling '{lib_name}' from {path}")
    return Tree(path, prefix=lib_name, excludes=['*.pyc', '__pycache__'])

# --- COLLECT DEPENDENCIES MANUALLY ---
# We use Tree() to force the inclusion of the entire folder
heavy_trees = []

libs_to_bundle = [
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

for lib in libs_to_bundle:
    t = get_lib_tree(lib)
    if t:
        heavy_trees.append(t)

# --- STANDARD COLLECTION FOR BINARIES ---
# Binaries (DLLs) still need hooks sometimes, sticking to collecting these
tf_bin = collect_all('tensorflow')[1]
np_bin = collect_all('numpy')[1]
pil_bin = collect_all('PIL')[1]

all_binaries = tf_bin + np_bin + pil_bin

# Manual Source Folders
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
    pathex=[site_packages],
    binaries=all_binaries,
    datas=manual_datas, # Trees are added to datas inside EXE/PYZ usually, or merged here? 
    # Tree objects behave like datas in newer PyInstaller but need to be passed to EXE or COLLECT
    # Wait, Tree cannot be in 'datas' list of Analysis directly if it's not a tuple list.
    # We will pass trees to the EXE/COLLECT step or convert them?
    # Spec file standard: datas=[] list of tuples. 
    # Tree returns a distinct object.
    
    hiddenimports=[
        'tensorflow', 'numpy', 'PIL', 'uvicorn', 'fastapi', 'neo4j', 
        'pypdf', 'pdfminer', 'DECIMER', 'uvicorn.loops.auto', 
        'uvicorn.protocols.http.auto', 'simple_websocket'
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

# Merge Trees into datas (Analysis doesn't accept Tree objects in datas list)
# We append them to a.datas
for t in heavy_trees:
     a.datas += t

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

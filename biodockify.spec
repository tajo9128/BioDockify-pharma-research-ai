# -*- mode: python ; coding: utf-8 -*-
import sys
import os
import importlib
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT
from PyInstaller.building.datastruct import Tree

block_cipher = None

# --- ROBUST PATH FINDER ---
def get_library_tree(name):
    """
    Imports a library to find its absolute path on disk, 
    then returns a Tree() object to force-bundle it.
    """
    try:
        # Import the module to get its true location
        mod = importlib.import_module(name)
        if hasattr(mod, '__file__'):
            # Most packages have an __init__.py, get the dirname
            path = os.path.dirname(mod.__file__)
        else:
            # namespace packages might behave differently, but for TF/Numpy this is fine
            path = os.path.dirname(mod.__path__[0])
            
        print(f"DEBUG: Found '{name}' at '{path}'")
        
        # Return the Tree object
        # prefix=name (e.g. 'tensorflow') ensures it sits in the root of the internal temp dir
        return Tree(path, prefix=name, excludes=['*.pyc', '__pycache__', '*.dist-info'])
        
    except ImportError as e:
        print(f"CRITICAL ERROR: Could not import '{name}'. Is it installed? Error: {e}")
        # We generally want to fail hard here, but for now allow continue to see what else fails
        return None
    except Exception as e:
        print(f"WARNING: Error processing '{name}': {e}")
        return None

# --- COLLECT HEAVY LIBS ---
heavy_libs = [
    'tensorflow', 
    'numpy', 
    'PIL', # usually 'PIL' but package is Pillow. import PIL works.
    'uvicorn', 
    'fastapi', 
    'neo4j',
    'pypdf',
    'pdfminer',
    'DECIMER'
]

manual_trees = []
for lib in heavy_libs:
    t = get_library_tree(lib)
    if t:
        manual_trees.append(t)

# --- MANUAL DATA FOLDERS ---
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
    binaries=[],
    datas=manual_datas, 
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

# --- INJECT TREES INTO DATAS ---
# This forces the inclusion of the files
for t in manual_trees:
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

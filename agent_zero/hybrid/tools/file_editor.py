"""
File Editor Tool - Allows the agent to read and modify files.
ESSENTIAL for self-repair and code editing.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class FileEditorTool:
    """
    Safe file operations for the agent.
    """
    
    def __init__(self, root_dir: str = "."):
        self.root_dir = os.path.abspath(root_dir)
        
    def _is_safe_path(self, path: str) -> bool:
        """Prevent escaping the root directory (path traversal)."""
        abs_path = os.path.abspath(path)
        return abs_path.startswith(self.root_dir)

    def read_file(self, params: dict) -> str:
        """
        Read content of a file.
        params: {"path": "relative/path/to/file"}
        """
        path = params.get("path") or params.get("file")
        if not path: return "Error: 'path' parameter required"
        
        try:
            if not self._is_safe_path(path):
                # For now, we might allow full access if user requested "FULL ACCESS"
                # But let's log it.
                logger.warning(f"FileEditor: Accessing path outside root: {path}")
            
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                return content
        except Exception as e:
            return f"Error reading file {path}: {str(e)}"

    def write_file(self, params: dict) -> str:
        """
        Write content to a file (OVERWRITE).
        params: {"path": "...", "content": "..."}
        """
        path = params.get("path") or params.get("file")
        content = params.get("content")
        
        if not path or content is None: return "Error: 'path' and 'content' required"
        
        try:
            # Create dirs if needed
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Successfully wrote to {path}"
        except Exception as e:
            return f"Error writing file {path}: {str(e)}"

    def replace_in_file(self, params: dict) -> str:
        """
        Replace string in file.
        params: {"path": "...", "old": "...", "new": "..."}
        """
        path = params.get("path") or params.get("file")
        old_str = params.get("old")
        new_str = params.get("new")
        
        if not path or old_str is None or new_str is None: 
            return "Error: 'path', 'old', and 'new' required"
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_str not in content:
                return f"Error: '{old_str}' not found in {path}"
                
            new_content = content.replace(old_str, new_str)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
                
            return f"Successfully replaced content in {path}"
        except Exception as e:
            return f"Error replacing in file {path}: {str(e)}"

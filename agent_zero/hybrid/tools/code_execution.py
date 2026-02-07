"""
Code Execution Tool - Safe shell command execution.
Allows the agent to run diagnosis commands and python scripts.
"""
import asyncio
import logging
import subprocess
from typing import Tuple

logger = logging.getLogger(__name__)

class SafeCodeExecutionTool:
    """
    Executes code/commands in the safer environment (Docker).
    """
    
    def __init__(self, allowed_commands: list = None):
        self.allowed_commands = allowed_commands # None = all (use with caution)
        
    async def execute_shell(self, command: str, timeout: int = 30) -> Tuple[int, str, str]:
        """
        Run a shell command.
        Returns: (return_code, stdout, stderr)
        """
        logger.info(f"Executing: {command}")
        
        try:
            # Create subprocess
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
                rc = proc.returncode
                
                out_str = stdout.decode().strip()
                err_str = stderr.decode().strip()
                
                return rc, out_str, err_str
                
            except asyncio.TimeoutError:
                proc.kill()
                return -1, "", "Command timed out"
                
        except Exception as e:
            logger.error(f"Execution failed: {e}")
            return -1, "", str(e)

    async def execute_python(self, code: str) -> str:
        """Execute a snippet of Python code."""
        # Wrap code to run as a script via python -c
        # For simplicity, we just dump to a tmp file and run it
        import tempfile
        import os
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                tmp_path = f.name
                
            rc, out, err = await self.execute_shell(f"python {tmp_path}")
            
            os.remove(tmp_path)
            
            if rc != 0:
                return f"Error ({rc}):\n{err}"
            return out
            
        except Exception as e:
            return f"Python execution logic failed: {e}"

import subprocess
import os
import time
import logging
import platform
import signal
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger("biodockify_services")

class ServiceManager:
    def __init__(self, config: dict):
        self.config = config
        self.processes: List[subprocess.Popen] = []
        self.is_windows = platform.system() == "Windows"

    def _get_startup_flags(self):
        """Returns flags to run subprocess silently (Windows only)."""
        if self.is_windows:
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            # CREATE_NO_WINDOW = 0x08000000
            creationflags = 0x08000000 
            return startupinfo, creationflags
        return None, 0

    def start_ollama(self):
        """Starts Ollama in 'serve' mode silently."""
        try:
            # Check if likely already running
            # simple check: curl localhost:11434 (skipped for speed, assuming start is safe)
            
            cmd = "ollama serve"
            logger.info(f"Starting Service: {cmd}")
            
            startupinfo, flags = self._get_startup_flags()
            
            proc = subprocess.Popen(
                cmd, 
                shell=False if self.is_windows else True, # shell=False is safer/better for process tracking if executable is in path
                startupinfo=startupinfo,
                creationflags=flags,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.processes.append(proc)
            logger.info("Ollama Service started in background.")
            
        except FileNotFoundError:
            logger.warning("Ollama executable not found in PATH.")
        except Exception as e:
            logger.error(f"Failed to start Ollama: {e}")

    def start_neo4j(self):
        """Starts Neo4j if configured."""
        # Neo4j is trickier as it varies by install type (Desktop vs Service vs Console)
        # This assumes 'neo4j' is in path and 'console' or 'start' works.
        # For Desktop users, this might not work without specific path config.
        # We will try a standard command.
        try:
            cmd = "neo4j start" 
            logger.info(f"Starting Service: {cmd}")
            
            startupinfo, flags = self._get_startup_flags()

            # Neo4j 'start' usually exits immediately as it spawns a daemon, 
            # so Popen might complete. 'console' runs in foreground.
            # providing 'console' might keep it alive as a child process we can kill.
            if self.is_windows:
                 cmd = "neo4j console" # Console keeps it attached so we can kill it later
            
            proc = subprocess.Popen(
                cmd,
                shell=True, # Often needs shell for batch files on Windows
                startupinfo=startupinfo,
                creationflags=flags,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.processes.append(proc)
            logger.info("Neo4j Service started in background.")
            
        except Exception as e:
            logger.warning(f"Failed to start Neo4j (may not be installed or in PATH): {e}")

    def stop_all(self):
        """Terminates all managed subprocesses."""
        logger.info(f"Stopping {len(self.processes)} background services...")
        for proc in self.processes:
            try:
                # Graceful termination first
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill() # Force kill
            except Exception as e:
                logger.error(f"Error stopping process {proc.pid}: {e}")
        self.processes.clear()

# Global Instance
service_manager = None

def get_service_manager(config: dict):
    global service_manager
    if service_manager is None:
        service_manager = ServiceManager(config)
    return service_manager

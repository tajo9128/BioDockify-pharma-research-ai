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

    def start_surfsense(self):
        """Starts SurfSense via Docker Compose."""
        try:
            # Assume we are in root, need to point to module
            compose_file = Path("modules/surfsense/docker-compose.yml")
            if not compose_file.exists():
                logger.warning("SurfSense docker-compose.yml not found.")
                return

            cmd = f"docker-compose -f {compose_file} up -d"
            logger.info(f"Starting Service: {cmd}")
            
            startupinfo, flags = self._get_startup_flags()
            
            proc = subprocess.Popen(
                cmd,
                shell=True,
                startupinfo=startupinfo,
                creationflags=flags,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            # Docker compose up returns, no need to keep proc in list unless tracking logs
            # Actually better to just run it and forget, or check status later.
            proc.wait() 
            logger.info("SurfSense initiated (Docker).")
            
        except Exception as e:
            logger.warning(f"Failed to start SurfSense: {e}")

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

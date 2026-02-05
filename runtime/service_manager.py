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
    """Manages background services for BioDockify."""
    
    def __init__(self, config: dict):
        self.config = config
        self.processes: List[subprocess.Popen] = []
        self.is_windows = platform.system() == "Windows"

    def _get_startup_flags(self):
        """Returns flags to run subprocess silently (Windows only)."""
        if self.is_windows:
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            creationflags = 0x08000000  # CREATE_NO_WINDOW
            return startupinfo, creationflags
        return None, 0

    def start_surfsense(self):
        """Starts SurfSense via Docker Compose."""
        try:
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
            proc.wait()
            logger.info("SurfSense initiated (Docker).")
            
        except Exception as e:
            logger.warning(f"Failed to start SurfSense: {e}")

    def stop_all(self):
        """Terminates all managed subprocesses."""
        logger.info(f"Stopping {len(self.processes)} background services...")
        for proc in self.processes:
            try:
                proc.terminate()
                try:
                    proc.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    proc.kill()
            except Exception as e:
                logger.error(f"Error stopping process {proc.pid}: {e}")
        self.processes.clear()

    def check_health(self, service_name: str) -> str:
        """Check the health status of a service."""
        import socket
        
        ports = {
            "lm_studio": 1234,
            "surfsense": 3003,
            "api": 8234
        }
        
        port = ports.get(service_name)
        if not port:
            return "unknown"
        
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5)
                result = s.connect_ex(("127.0.0.1", port))
                return "running" if result == 0 else "stopped"
        except Exception as e:
            logger.error(f"Health check failed for {service_name}: {e}")
            return "error"

    def attempt_repair(self, service_name: str) -> dict:
        """Attempt to repair a stopped service."""
        if service_name == "surfsense":
            self.start_surfsense()
            time.sleep(3)
            status = self.check_health("surfsense")
            return {
                "service": service_name,
                "action": "restart_attempted",
                "success": status == "running"
            }
        elif service_name == "lm_studio":
            # LM Studio is user-managed, we just report status
            return {
                "service": service_name,
                "action": "manual_start_required",
                "success": False,
                "message": "Please start LM Studio manually from https://lmstudio.ai"
            }
        else:
            return {
                "service": service_name,
                "action": "unknown_service",
                "success": False
            }

# Global Instance
service_manager = None

def get_service_manager(config: dict):
    global service_manager
    if service_manager is None:
        service_manager = ServiceManager(config)
    return service_manager

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

    def _is_ollama_installed(self) -> bool:
        """Check if Ollama executable is available in PATH."""
        try:
            if self.is_windows:
                result = subprocess.run(
                    ["where", "ollama"], 
                    capture_output=True, 
                    timeout=5
                )
            else:
                result = subprocess.run(
                    ["which", "ollama"], 
                    capture_output=True, 
                    timeout=5
                )
            return result.returncode == 0
        except Exception:
            return False

    def start_ollama(self) -> bool:
        """Starts Ollama in 'serve' mode with proper validation and error handling."""
        try:
            # Check if already running
            if self.check_health("ollama") == "running":
                logger.info("✓ Ollama is already running.")
                return True
            
            # Check if Ollama is installed
            if not self._is_ollama_installed():
                logger.error("✗ Ollama not found in PATH. Please install Ollama from https://ollama.ai")
                return False
            
            logger.info("Starting Ollama service...")
            
            startupinfo, flags = self._get_startup_flags()
            
            # Use shlex for proper command splitting on non-Windows
            if self.is_windows:
                cmd = ["ollama", "serve"]
            else:
                cmd = "ollama serve"
            
            # Capture stderr for debugging, but still run in background
            log_file = Path.home() / ".biodockify" / "logs" / "ollama.log"
            log_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(log_file, 'a') as log_handle:
                proc = subprocess.Popen(
                    cmd,
                    shell=not self.is_windows,  # shell=True on Linux/Mac, shell=False on Windows
                    startupinfo=startupinfo,
                    creationflags=flags,
                    stdout=log_handle,
                    stderr=subprocess.STDOUT
                )
                self.processes.append(proc)
            
            # Wait and verify it started with exponential backoff
            max_retries = 5
            base_delay = 2  # Start with 2 seconds
            
            for attempt in range(max_retries):
                delay = base_delay * (1.5 ** attempt)  # 2, 3, 4.5, 6.75, 10.1 seconds
                logger.info(f"Waiting {delay:.1f}s for Ollama startup (attempt {attempt + 1}/{max_retries})...")
                time.sleep(delay)
                
                if self.check_health("ollama") == "running":
                    logger.info("✓ Ollama started successfully")
                    return True
                
                if attempt < max_retries - 1:
                    logger.warning(f"Ollama not ready yet, retrying...")
            
            # All retries failed - try to read error from log
            try:
                with open(log_file, 'r') as f:
                    recent_logs = f.read()[-500:]  # Last 500 chars
                    logger.error(f"✗ Ollama failed to start after {max_retries} attempts. Recent logs:\n{recent_logs}")
            except:
                logger.error(f"✗ Ollama failed to start after {max_retries} attempts. Check ~/.biodockify/logs/ollama.log")
            return False
                
        except FileNotFoundError:
            logger.error("✗ Ollama executable not found in PATH. Install from https://ollama.ai")
            return False
        except Exception as e:
            logger.error(f"✗ Failed to start Ollama: {e}")
            return False


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

    # === SERVICE WATCHDOG (Phase 19) ===
    
    def check_health(self, service_name: str) -> str:
        """Check the health status of a service."""
        import socket
        
        ports = {
            "ollama": 11434,
            "surfsense": 3003,
            "api": 8000
        }
        
        port = ports.get(service_name)
        if not port:
            return "unknown"
        
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(("127.0.0.1", port))
                return "running" if result == 0 else "stopped"
        except Exception as e:
            logger.error(f"Health check failed for {service_name}: {e}")
            return "error"

    def ensure_ollama(self) -> bool:
        """Ensure Ollama is running; start it if not."""
        status = self.check_health("ollama")
        if status == "running":
            logger.info("Ollama is already running.")
            return True
        
        logger.warning("Ollama not running. Attempting to start...")
        self.start_ollama()
        
        # Wait and re-check
        import time
        time.sleep(2)
        
        new_status = self.check_health("ollama")
        if new_status == "running":
            logger.info("Ollama started successfully.")
            return True
        else:
            logger.error("Failed to start Ollama.")
            return False

    def attempt_repair(self, service_name: str) -> dict:
        """Attempt to repair a stopped service."""
        if service_name == "ollama":
            success = self.ensure_ollama()
            return {
                "service": service_name,
                "action": "restart_attempted",
                "success": success
            }
        elif service_name == "surfsense":
            self.start_surfsense()
            import time
            time.sleep(3)
            status = self.check_health("surfsense")
            return {
                "service": service_name,
                "action": "restart_attempted",
                "success": status == "running"
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

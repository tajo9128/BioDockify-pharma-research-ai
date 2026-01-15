"""
System Doctor
Diagnostic engine for BioDockify Agent Zero.
Performs self-checks on dependencies, services, and configuration.
"""

import sys
import os
import importlib
import socket
import logging
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("system_doctor")

class SystemDoctor:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.report = {
            "status": "healthy", # healthy, degraded, unhealthy
            "issues": [],
            "checks": {}
        }

    def run_diagnosis(self) -> Dict[str, Any]:
        """Runs all diagnostic checks and returns the report."""
        logger.info("Running System Diagnosis...")
        
        self._check_dependencies()
        self._check_services()
        self._check_configuration()
        self._check_filesystem()
        
        # Determine overall status
        if any(i["severity"] == "critical" for i in self.report["issues"]):
            self.report["status"] = "unhealthy"
        elif self.report["issues"]:
            self.report["status"] = "degraded"
        else:
            self.report["status"] = "healthy"
            
        return self.report

    def _check_dependencies(self):
        """Check critical Python dependencies."""
        critical_libs = ["fastapi", "uvicorn", "numpy", "requests", "yaml", "pydantic"]
        # AI libs might be optional in some modes, but let's check core ones
        
        missing = []
        for lib in critical_libs:
            try:
                importlib.import_module(lib)
            except ImportError:
                missing.append(lib)
        
        self.report["checks"]["dependencies"] = "ok" if not missing else "fail"
        
        if missing:
            self.report["issues"].append({
                "type": "dependency",
                "severity": "critical",
                "message": f"Missing critical libraries: {', '.join(missing)}"
            })

    def _check_services(self):
        """Check connectivity to background services."""
        services = {}
        
        # 1. Ollama (Default Port 11434)
        ollama_url = self.config.get("ai_provider", {}).get("ollama_url", "http://localhost:11434")
        if "localhost" in ollama_url or "127.0.0.1" in ollama_url:
            port = 11434 # Default
            try:
                # Parse port if custom
                if ":" in ollama_url.split("//")[-1]:
                    port = int(ollama_url.split(":")[-1].split("/")[0])
                
                if self._check_port(port):
                    services["ollama"] = "running"
                else:
                    services["ollama"] = "stopped"
                    # Only an issue if mode is ollama/auto
                    mode = self.config.get("ai_provider", {}).get("mode", "auto")
                    if mode in ["ollama", "auto"]:
                         self.report["issues"].append({
                            "type": "service",
                            "severity": "high",
                            "message": "Local AI (Ollama) is not running but is selected as provider."
                        })
            except Exception as e:
                services["ollama"] = f"error: {str(e)}"

        # 2. SurfSense (Port 3003)
        if self._check_port(3003):
            services["surfsense"] = "running"
        else:
            services["surfsense"] = "stopped"
            # SurfSense is optional/experimental, so severity low
            # self.report["issues"].append({
            #     "type": "service",
            #     "severity": "low",
            #     "message": "SurfSense Knowledge Engine is inactive."
            # })

        self.report["checks"]["services"] = services

    def _check_configuration(self):
        """Check for valid API keys and settings."""
        ai_config = self.config.get("ai_provider", {})
        keys_found = []
        
        if ai_config.get("google_key"): keys_found.append("google")
        if ai_config.get("openrouter_key"): keys_found.append("openrouter")
        if ai_config.get("huggingface_key"): keys_found.append("huggingface")
        if ai_config.get("custom_key"): keys_found.append("custom")
        
        self.report["checks"]["keys_found"] = keys_found
        
        mode = ai_config.get("mode", "auto")
        if mode != "ollama" and not keys_found and mode != "auto":
             self.report["issues"].append({
                "type": "config",
                "severity": "high",
                "message": f"Mode is set to '{mode}' but no valid Cloud API keys were found."
            })
        
        if mode == "auto" and not keys_found and self.report["checks"]["services"].get("ollama") != "running":
             self.report["issues"].append({
                "type": "config",
                "severity": "critical",
                "message": "Auto Mode: No Cloud Keys AND Local AI is down. System has no brain."
            })

    def _check_filesystem(self):
        """Check if data directories are writable."""
        paths = ["data", "logs", "workspace"]
        base = Path(os.getcwd())
        
        fs_status = {}
        for p in paths:
            target = base / p
            if not target.exists():
                try:
                    target.mkdir(parents=True, exist_ok=True)
                    fs_status[p] = "created"
                except Exception as e:
                    fs_status[p] = f"fail_create: {e}"
                    self.report["issues"].append({
                        "type": "filesystem",
                        "severity": "critical",
                        "message": f"Cannot create directory: {p}"
                    })
            else:
                # Check write perm
                if os.access(target, os.W_OK):
                    fs_status[p] = "writable"
                else:
                    fs_status[p] = "readonly"
                    self.report["issues"].append({
                        "type": "filesystem",
                        "severity": "critical",
                        "message": f"Directory is read-only: {p}"
                    })
        
        self.report["checks"]["filesystem"] = fs_status

    def _check_port(self, port: int, host: str = "127.0.0.1") -> bool:
        """Utils: Check if a port is open."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            return s.connect_ex((host, port)) == 0

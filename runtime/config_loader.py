"""
BioDockify Configuration Loader
Handles loading of runtime configuration and API keys.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any

# Define paths
BASE_DIR = Path(__file__).parent.parent
CONFIG_PATH = BASE_DIR / "runtime" / "config.yaml"

DEFAULT_CONFIG = {
    "api_keys": {
        "openai_key": "",
        "elsevier_key": "",
        "lens_key": ""
    },
    "settings": {
        "use_gpu": False,
        "log_level": "INFO",
        "lab_interface": {
            "sila_enabled": True,
            "report_format": "docx"
        }
    }
}

def load_config() -> Dict[str, Any]:
    """
    Load configuration from runtime/config.yaml.
    Creates default file if it doesn't exist.
    """
    if not CONFIG_PATH.exists():
        _create_default_config()
    
    try:
        with open(CONFIG_PATH, "r") as f:
            config = yaml.safe_load(f)
            if not config:
                return DEFAULT_CONFIG
            return config
    except Exception as e:
        print(f"[!] Error loading config: {e}")
        return DEFAULT_CONFIG

def _create_default_config():
    """Create a default configuration file."""
    try:
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w") as f:
            yaml.dump(DEFAULT_CONFIG, f, default_flow_style=False)
        print(f"[+] Created default config at {CONFIG_PATH}")
    except Exception as e:
        print(f"[!] Failed to create default config: {e}")

if __name__ == "__main__":
    cfg = load_config()
    print("Loaded Config:", cfg)

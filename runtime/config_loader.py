"""
BioDockify Configuration Engine
Handles loading, saving, and validation of the application's runtime configuration.
Implements the 'BioDockify v2 Settings Contract'.
"""

import os
import yaml
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

import sys

# Define paths
BASE_DIR = Path(__file__).parent.parent

def get_config_path():
    """
    Determines the appropriate config path based on environment.
    Prioritizes %APPDATA% in production (frozen/installed), falls back to local dev.
    """
    app_name = "BioDockify"
    
    # Check if running as compiled executable (PyInstaller)
    if getattr(sys, 'frozen', False):
        # Production: Use User AppData
        app_data = os.getenv('APPDATA')
        if app_data:
            config_dir = Path(app_data) / app_name
            config_dir.mkdir(parents=True, exist_ok=True)
            return config_dir / "config.yaml"
            
    # Development: Use local source directory
    return BASE_DIR / "runtime" / "config.yaml"

CONFIG_PATH = get_config_path()

# -----------------------------------------------------------------------------
# DEFAULT CONFIGURATION (The "Safe Contract")
# -----------------------------------------------------------------------------
DEFAULT_CONFIG = {
    # SECTION A: PROJECT & RESEARCH CONTEXT
    "project": {
        "name": "My PhD Research",
        "type": "PhD Thesis",  # Options: Literature Review, Drug Discovery, Thesis, Methodology
        "disease_context": "Alzheimer's Disease",
        "stage": "Literature Review"  # Options: Exploration, Review, Hypothesis, Experiment, Writing
    },

    # SECTION B: AGENT ZERO BEHAVIOR
    "agent": {
        "mode": "semi-autonomous",  # Options: assisted, semi-autonomous, autonomous
        "reasoning_depth": "standard",  # Options: shallow, standard, deep
        "self_correction": True,
        "max_retries": 3,
        "failure_policy": "ask_user"  # Options: ask_user, auto_retry, abort
    },

    # SECTION C: LITERATURE & EVIDENCE
    "literature": {
        "sources": ["pubmed", "europe_pmc", "openalex"], # Default Active Sources
        "enable_crossref": True,
        "enable_preprints": False, # Tier 3 (Disabled by default)
        "year_range": 10,  # Last N years
        "article_types": ["review", "experimental", "computational"],
        "min_citations": 5,
        "novelty_strictness": "medium",  # Options: low, medium, high
        "include_preprints": False
    },

    # SECTION E: API & AI SETTINGS
    "ai_provider": {
        "mode": "free_api",  # Options: free_api, hybrid
        "primary_model": "google", # Options: google, openrouter, huggingface (OpenAI deprecated)
        "google_key": "",
        "openrouter_key": "",
        "huggingface_key": "",
        "elsevier_key": "",
        "elsevier_key": "",
        "pubmed_email": "",  # Required for NCBI compliance
    },

    # SECTION I: EXECUTION & SAFETY
    "execution": {
        "mode": "research",  # Options: safe (no code), research (tools allowed)
        "max_runtime_minutes": 45,
        "use_knowledge_graph": True,
        "human_approval_gates": True
    },
    
    # SYSTEM INTERNALS (Not typically exposed to user)
    "system": {
        "log_level": "INFO",
        "version": "2.0.43"
    }
}

class ConfigLoader:
    def __init__(self):
        self._ensure_config_exists()

    def _ensure_config_exists(self):
        """Create default config if missing."""
        if not CONFIG_PATH.exists():
            self._save_to_disk(DEFAULT_CONFIG)
            print(f"[+] Created default config at {CONFIG_PATH}")

    def load_config(self) -> Dict[str, Any]:
        """Load configuration from disk with fail-safe defaults."""
        try:
            with open(CONFIG_PATH, "r") as f:
                user_config = yaml.safe_load(f)
                
            if not user_config:
                return DEFAULT_CONFIG
            
            # Merit: Deep merge with defaults to ensure new keys exist
            return self._merge_defaults(DEFAULT_CONFIG, user_config)
            
        except Exception as e:
            print(f"[!] Error loading config: {e}")
            return DEFAULT_CONFIG

    def save_config(self, new_config: Dict[str, Any]) -> bool:
        """Save new configuration to disk."""
        try:
            # Basic validation could go here
            self._save_to_disk(new_config)
            return True
        except Exception as e:
            print(f"[!] Failed to save config: {e}")
            return False

    def reset_to_defaults(self) -> Dict[str, Any]:
        """Reset configuration to factory defaults."""
        self._save_to_disk(DEFAULT_CONFIG)
        return DEFAULT_CONFIG

    def _save_to_disk(self, config_data: Dict[str, Any]):
        """Helper to write YAML to disk."""
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w") as f:
            yaml.dump(config_data, f, default_flow_style=False, sort_keys=False)

    def _merge_defaults(self, defaults: Dict, user: Dict) -> Dict:
        """
        Recursive merge to ensure user config has all required keys from defaults.
        Preserves user values where they exist.
        """
        result = defaults.copy()
        for key, value in user.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_defaults(result[key], value)
            else:
                result[key] = value
        return result

# Singleton instance
_loader = ConfigLoader()

def load_config() -> Dict[str, Any]:
    return _loader.load_config()

def save_config(config: Dict[str, Any]) -> bool:
    return _loader.save_config(config)

def reset_config() -> Dict[str, Any]:
    return _loader.reset_to_defaults()

if __name__ == "__main__":
    # Test run
    cfg = load_config()
    print("Loaded Config successfully.")

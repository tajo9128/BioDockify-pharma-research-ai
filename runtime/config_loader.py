"""
BioDockify Configuration Engine
Handles loading, saving, and validation of the application's runtime configuration.
Implements the 'BioDockify v2 Settings Contract'.
"""

import os
import platform
import yaml
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

import sys

import base64
import uuid

# Define paths
BASE_DIR = Path(__file__).parent.parent

class SecurityManager:
    """
    Handles encryption of sensitive configuration values at rest.
    Uses a machine-specific seed for basic obfuscation/encryption 
    (since full cryptography lib is not guaranteed).
    """
    def __init__(self):
        # Machine-specific key (stable across runs on same machine)
        self.node = str(uuid.getnode())
        self.sensitive_suffices = ("_key", "password", "secret", "token", "email")
        
    def _xor_cipher(self, text: str) -> str:
        """Simple XOR cipher with node info."""
        if not text: return text
        return ''.join(chr(ord(c) ^ ord(self.node[i % len(self.node)])) for i, c in enumerate(text))

    def encrypt_value(self, value: str) -> str:
        """Encrypts a string value."""
        if not value or value.startswith("ENC:"): return value
        try:
            # 1. XOR
            xored = self._xor_cipher(value)
            # 2. Base64 encode to ensure safe character set for YAML
            b64 = base64.b64encode(xored.encode("utf-8")).decode("utf-8")
            return f"ENC:{b64}"
        except:
            return value

    def decrypt_value(self, value: str) -> str:
        """Decrypts a string value."""
        if not value or not isinstance(value, str) or not value.startswith("ENC:"):
            return value
        try:
             payload = value[4:] # Strip ENC:
             # 1. Base64 decode
             xored = base64.b64decode(payload).decode("utf-8")
             # 2. XOR (Symmetric)
             return self._xor_cipher(xored)
        except Exception as e:
            print(f"Decryption failed: {e}")
            return value

    def process_config(self, config: Dict, mode: str) -> Dict:
        """
        Recursively encrypts or decrypts sensitive keys in a config dict.
        mode: 'encrypt' or 'decrypt'
        """
        processed = config.copy()
        for k, v in processed.items():
            if isinstance(v, dict):
                processed[k] = self.process_config(v, mode)
            elif isinstance(v, str) and any(k.endswith(s) for s in self.sensitive_suffices):
                if mode == 'encrypt':
                    processed[k] = self.encrypt_value(v)
                elif mode == 'decrypt':
                    processed[k] = self.decrypt_value(v)
        return processed

security_manager = SecurityManager()

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
    # Support BIO_ENV for specific configs (dev/prod/staging)
    env = os.getenv("BIO_ENV", "").lower()
    filename = f"config.{env}.yaml" if env else "config.yaml"
    
    # Fallback to standard config if env-specific doesn't exist
    target = BASE_DIR / "runtime" / filename
    if env and not target.exists():
        print(f"[*] {filename} not found, falling back to config.yaml")
        return BASE_DIR / "runtime" / "config.yaml"
        
    return target

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

    # SECTION C: LITERATURE & EVIDENCE (Legacy + V2 Pharma)
    "literature": {
        "sources": ["pubmed"], 
        "enable_crossref": True,
        "year_range": 10,  
        "novelty_strictness": "medium"
    },
    
    # NEW: Pharma Pipeline Controls
    "pharma": {
        "enable_pubtator": True,
        "enable_semantic_scholar": True,
        "enable_unpaywall": True,
        "citation_threshold": "high",
        "sources": {
            "pubmed": True,
            "pmc": True,
            "biorxiv": False,
            "chemrxiv": False,
            "clinicaltrials": True,
            "google_scholar": False, # New
            "openalex": True,        # New (High reliability)
            "semantic_scholar": True, # New
            "ieee": False,           # New
            "elsevier": False,       # Paid/Key
            "scopus": False,         # Paid/Key
            "wos": False,            # Web of Science
            "science_index": False   # Science Index
        }
    },

    # SECTION E: API & AI SETTINGS
    "ai_provider": {
        "mode": "auto",  # Options: auto, ollama, z-ai
        "primary_model": "google", 
        "ollama_url": "http://localhost:11434",
        "ollama_model": "llama2",
        "google_key": "",
        "openrouter_key": "",
        "huggingface_key": "",
        "glm_key": "", # GLM-4.7 Support
        "elsevier_key": "", # For Scopus/ScienceDirect
        "pubmed_email": "",
    },
    
    # NEW: Advanced Hardware Controls
    "ai_advanced": {
        "context_window": 8192,
        "gpu_layers": -1,
        "thread_count": 8
    },
    
    # NEW: User Persona
    "persona": {
        "role": "PhD Student",
        "strictness": "conservative",
        "introduction": "", # Box 1: "Introduce yourself"
        "research_focus": "" # Box 2: "His work"
    },
    
    # NEW: Output Config
    "output": {
        "format": "markdown",
        "citation_style": "apa",
        "include_disclosure": True,
        "output_dir": ""
    },

    # SECTION I: EXECUTION & SAFETY
    "execution": {
        "mode": "research",  # Options: safe (no code), research (tools allowed)
        "max_runtime_minutes": 45,
        "use_knowledge_graph": True,
        "human_approval_gates": True
    },
    
    # SYSTEM INTERNALS
    "system": {
        "auto_start": True,
        "minimize_to_tray": True, 
        "pause_on_battery": True,
        "max_cpu_percent": 80,
        "log_level": "INFO",
        "version": "2.13.1"
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
            merged = self._merge_defaults(DEFAULT_CONFIG, user_config)
            
            # Migration Check
            final_config = self._migrate_config(merged)
            
            # Decrypt sensitive values for Runtime usage
            return security_manager.process_config(final_config, 'decrypt')
            
        except Exception as e:
            print(f"[!] Error loading config: {e}")
            return DEFAULT_CONFIG

    def save_config(self, new_config: Dict[str, Any]) -> bool:
        """Save new configuration to disk."""
        try:
            # 1. Validate
            if not self._validate_config(new_config):
                print("[!] Config validation failed. Aborting save.")
                return False

            # 2. Backup existing
            self.backup_config()
            
            # 3. Encrypt sensitive values before saving to Disk
            secure_config = security_manager.process_config(new_config, 'encrypt')
            self._save_to_disk(secure_config)
            return True
        except Exception as e:
            print(f"[!] Failed to save config: {e}")
            return False

    def reset_to_defaults(self) -> Dict[str, Any]:
        """Reset configuration to factory defaults."""
        self._save_to_disk(DEFAULT_CONFIG)
        return DEFAULT_CONFIG

    def _save_to_disk(self, config_data: Dict[str, Any]):
        """Helper to write YAML to disk atomically."""
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        # Write to temp file first
        tmp_path = CONFIG_PATH.with_suffix('.tmp')
        try:
            with open(tmp_path, "w") as f:
                yaml.dump(config_data, f, default_flow_style=False, sort_keys=False)
            
            # Atomic rename/replace
            if list(platform.uname()).count("Windows") > 0:
                 # Windows can't atomic replace if dest exists, need remove first
                 if CONFIG_PATH.exists():
                     os.remove(CONFIG_PATH)
            
            os.replace(tmp_path, CONFIG_PATH)
        except Exception as e:
            print(f"[!] Atomic save failed: {e}")
            if tmp_path.exists():
                os.remove(tmp_path)
            raise e

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

    def backup_config(self):
        """Creates a backup of the current config file."""
        if CONFIG_PATH.exists():
            backup_path = CONFIG_PATH.with_suffix('.bak')
            try:
                shutil.copy2(CONFIG_PATH, backup_path)
            except Exception as e:
                print(f"[!] Backup failed: {e}")

    def _migrate_config(self, config: Dict) -> Dict:
        """
        Handles version migration.
        """
        current_version = config.get("system", {}).get("version", "0.0.0")
        target_version = DEFAULT_CONFIG["system"]["version"]
        
        if current_version != target_version:
            print(f"[*] Migrating Config: {current_version} -> {target_version}")
            # Logic for specific version upgrades could go here
            # For now, we just update the version tag since _merge_defaults handles structure
            config["system"]["version"] = target_version
            # Auto-save migrated config (encrypted)
            secure = security_manager.process_config(config, 'encrypt')
            self._save_to_disk(secure)
            
        return config

    def _validate_config(self, config: Dict) -> bool:
        """
        Basic Schema Validation.
        Returns True if valid, False otherwise.
        """
        required_sections = ["project", "agent", "ai_provider", "system"]
        for section in required_sections:
            if section not in config:
                print(f"[!] Missing section: {section}")
                return False
                
        # Validate critical numeric ranges
        try:
            ctx = config.get("ai_advanced", {}).get("context_window", 8192)
            if not isinstance(ctx, int) or ctx < 1024:
                print("[!] Invalid context_window")
                return False
        except:
             return False
             
        return True

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

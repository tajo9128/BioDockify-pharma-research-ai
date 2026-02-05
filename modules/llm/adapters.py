"""
LLM Adapters
Encapsulates API interaction logic for various AI providers.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import requests
import json

class BaseLLMAdapter(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt. Returns raw text."""
        pass

class GoogleGeminiAdapter(BaseLLMAdapter):
    """Adapter for Google Gemini API (REST)."""
    
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def generate(self, prompt: str, **kwargs) -> str:
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        try:
            resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            raise ValueError(f"Google Gemini API Error: {e}")

class OpenRouterAdapter(BaseLLMAdapter):
    """Adapter for OpenRouter API."""
    
    def __init__(self, api_key: str, model: str = "mistralai/mistral-7b-instruct"):
        self.api_key = api_key
        self.model = model
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    def generate(self, prompt: str, **kwargs) -> str:
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        try:
            resp = requests.post(
                self.url, 
                json=payload, 
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                    # Add HTTP-Referer or X-Title if requested by OpenRouter best practices
                }, 
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise ValueError(f"OpenRouter API Error: {e}")

class HuggingFaceAdapter(BaseLLMAdapter):
    """Adapter for HuggingFace Inference API."""
    
    def __init__(self, api_key: str, model: str = "mistralai/Mixtral-8x7B-Instruct-v0.1"):
        self.api_key = api_key
        self.model = model
        # Note: HF URL format depends on model
        self.url = f"https://api-inference.huggingface.co/models/{self.model}"

    def generate(self, prompt: str, **kwargs) -> str:
        # HF Inference API parameters
        payload = {
            "inputs": prompt, 
            "parameters": {
                "max_new_tokens": kwargs.get("max_new_tokens", 1024), 
                "return_full_text": False
            }
        }
        
        try:
            resp = requests.post(
                self.url, 
                json=payload, 
                headers={"Authorization": f"Bearer {self.api_key}"}, 
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            # HF returns a list of result objects
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("generated_text", "")
            elif isinstance(data, dict) and "generated_text" in data:
                 return data["generated_text"]
            else:
                raise ValueError(f"Unexpected HF Response: {data}")
        except Exception as e:
            raise ValueError(f"HuggingFace API Error: {e}")

class CustomAdapter(BaseLLMAdapter):
    """Generic OpenAI-Compatible Adapter."""
    
    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        # Robustly handle URLs ending in /models
        base_url = base_url.rstrip('/')
        if base_url.endswith('/models'):
             base_url = base_url[:-7]
        self.base_url = base_url
        self.model = model
        # Robustly handle Bearer prefix if user accidentally included it
        if api_key and api_key.startswith("Bearer "):
            api_key = api_key.replace("Bearer ", "")
        self.api_key = api_key

    def generate(self, prompt: str, **kwargs) -> str:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            
            if resp.status_code == 401:
                raise ValueError("Invalid API Key (401 Unauthorized)")
            elif resp.status_code == 404:
                raise ValueError(f"Endpoint not found (404). Check Base URL: {url}")
            elif resp.status_code == 403:
                raise ValueError("Access Denied (403 Forbidden)")
                
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            raise ValueError("Connection timed out. The server might be slow.")
        except requests.exceptions.ConnectionError:
            raise ValueError(f"Could not connect to {self.base_url}. Check if the server is running.")
        except Exception as e:
            raise ValueError(f"Custom API Error: {e}")

import litellm

class LMStudioAdapter(BaseLLMAdapter):
    """
    Dedicated Adapter for LM Studio Local Inference using LiteLLM.
    Enforces OpenAI compatibility and attempts to mandate JSON structure.
    Includes Automatic Model Detection.
    """
    
    PREFERRED_MODELS = [
        "openbiollm",
        "biomed",
        "mistral",
        "llama",
        "lfm",
        "phi",
        "gemma"
    ]

    def __init__(self, base_url: str = "http://localhost:1234/v1", model: str = "auto"):
        # Robustly handle URLs ending in /models by stripping it
        base_url = base_url.rstrip('/')
        if base_url.endswith('/models'):
             base_url = base_url[:-7] # Remove /models
             
        self.base_url = base_url.rstrip('/')
        self.config_model = model
        self.api_base = self.base_url
        self._detected_model = None
        
        # Try to detect immediately if possible, but don't crash if server down on init
        # (Lazy detection in generate is safer for startup)
        pass

    def _auto_select_model(self) -> str:
        """
        Automatically selects the best available model from LM Studio.
        """
        if self._detected_model:
            return self._detected_model
            
        try:
            url = f"{self.base_url}/models"
            # Fast timeout for detection
            r = requests.get(url, timeout=2)
            r.raise_for_status()
            
            data = r.json().get("data", [])
            available_ids = [m["id"] for m in data]
            
            if not available_ids:
                raise ValueError("LM Studio is running but No models are loaded.")
                
            # Selection Logic
            selected = None
            
            # 1. Try to find preferred models
            for pref in LMStudioAdapter.PREFERRED_MODELS:
                for m_id in available_ids:
                    if pref.lower() in m_id.lower():
                        selected = m_id
                        break
                if selected: break
            
            # 2. Fallback to first available
            if not selected:
                selected = available_ids[0]
                
            self._detected_model = selected
            print(f"[OK] LM Studio Model Auto-Selected: {selected}")
            return selected
            
        except requests.exceptions.RequestException:
             # If we can't connect, we can't auto-detect. 
             # Return configured defaults or raise error depending on context.
             # For now, return config model to let caller fail normally if down.
             return self.config_model if self.config_model != "auto" else "local-model"
             
        except Exception as e:
            print(f"[WARN] Model Auto-Detection Warning: {e}")
            return self.config_model if self.config_model != "auto" else "local-model"

    def generate(self, prompt: str, **kwargs) -> str:
        try:
            # Determine effective model
            if self.config_model == "auto" or self.config_model == "local-model":
                effective_model = self._auto_select_model()
            else:
                effective_model = self.config_model
            
            messages = [{"role": "user", "content": prompt}]
            
            # Check if we should enforce JSON mode
            response_format = None
            if "json" in prompt.lower():
                response_format = {"type": "json_object"}

            # LiteLLM call
            response = litellm.completion(
                model=f"openai/{effective_model}", 
                api_base=self.api_base,
                api_key="lm-studio", 
                messages=messages,
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 2048),
                response_format=response_format
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            msg = str(e)
            if "Connection" in msg or "refused" in msg:
                 raise ValueError(
                    f"LM Studio Connection Failed: Could not connect to {self.base_url}. "
                    "Please ensure LM Studio is running and the 'Local Server' is started."
                )
            if "formatted" in msg or "404" in msg:
                 # Likely model not found issue if auto-detect failed or wasn't used
                 raise ValueError(
                    f"LM Studio Error: Model '{self.config_model}' not found or server error. "
                    f"Ensure a model is loaded in LM Studio. Details: {e}"
                 )
            raise ValueError(f"LM Studio/LiteLLM Error: {e}")

class ZhipuAdapter(BaseLLMAdapter):
    """Adapter for Zhipu AI (GLM-4)."""
    
    def __init__(self, api_key: str, model: str = "glm-4"):
        self.api_key = api_key
        self.model = model
        self.url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

    def generate(self, prompt: str, **kwargs) -> str:
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            resp = requests.post(self.url, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise ValueError(f"Zhipu/GLM API Error: {e}")


class OllamaAdapter(BaseLLMAdapter):
    """
    Robust adapter for local Ollama LLM with retry logic and graceful fallbacks.
    """
    
    MAX_RETRIES = 3
    RETRY_DELAY = 2.0
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        self.base_url = base_url.rstrip('/')
        self.model = model
        self._failure_count = 0
        self._last_success = 0
        self._is_available_cache = None
        self._cache_time = 0
        self._available_models_cache = None
        self._models_cache_time = 0

    def model_exists(self, model_name: str = None) -> bool:
        """Check if a model exists in Ollama."""
        model_to_check = model_name or self.model
        available = self.list_models()
        
        # Check exact match or base model name match
        for m in available:
            if m == model_to_check or m.startswith(model_to_check.split(':')[0]):
                return True
        return False

    def _verify_model_or_fallback(self) -> str:
        """Verify model exists, try to find alternative, or return error message."""
        if self.model_exists():
            return ""  # Model exists, no error
        
        available = self.list_models()
        
        if not available:
            return (
                f"[Model Not Found] No models available in Ollama. "
                f"Please install a model:\n"
                f"  ollama pull llama3\n"
                f"  ollama pull mistral\n"
                f"  ollama pull gemma2"
            )
        
        return (
            f"[Model Not Found] Model '{self.model}' is not installed in Ollama.\n"
            f"Available models: {', '.join(available[:5])}\n"
            f"To install the model run: ollama pull {self.model}"
        )

    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text with automatic retries and model verification."""
        
        # Pre-check: Verify model exists
        model_error = self._verify_model_or_fallback()
        if model_error:
            return model_error
        
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "num_predict": kwargs.get("max_tokens", 1024)
            }
        }
        
        last_error = None
        for attempt in range(self.MAX_RETRIES):
            try:
                resp = requests.post(url, json=payload, timeout=120)
                
                # Handle specific HTTP errors
                if resp.status_code == 404:
                    return self._model_not_found_error()
                
                resp.raise_for_status()
                data = resp.json()
                
                # Check for Ollama-specific error in response
                if "error" in data:
                    error_msg = data.get("error", "")
                    if "not found" in error_msg.lower() or "doesn't exist" in error_msg.lower():
                        return self._model_not_found_error()
                    return f"[Ollama Error] {error_msg}"
                
                self._failure_count = 0
                import time as t
                self._last_success = t.time()
                return data.get("response", "")
                
            except requests.exceptions.ConnectionError as e:
                last_error = e
                self._failure_count += 1
                if attempt < self.MAX_RETRIES - 1:
                    import time as t
                    t.sleep(self.RETRY_DELAY * (attempt + 1))
                    continue
                    
            except requests.exceptions.Timeout as e:
                last_error = e
                self._failure_count += 1
                if attempt < self.MAX_RETRIES - 1:
                    import time as t
                    t.sleep(self.RETRY_DELAY)
                    continue
                    
            except requests.exceptions.HTTPError as e:
                # Parse HTTP error for better message
                if e.response is not None and e.response.status_code == 404:
                    return self._model_not_found_error()
                last_error = e
                break
                    
            except Exception as e:
                last_error = e
                break
        
        # Return graceful fallback instead of crashing
        return self._graceful_fallback(str(last_error))
    
    def _model_not_found_error(self) -> str:
        """Return a helpful error message when model is not found."""
        available = self.list_models()
        if available:
            return (
                f"[Model Not Found] Model '{self.model}' is not installed.\n"
                f"Available models: {', '.join(available[:5])}\n"
                f"Install with: ollama pull {self.model}"
            )
        return (
            f"[Model Not Found] Model '{self.model}' is not installed.\n"
            f"Install with: ollama pull {self.model}\n"
            f"Or try: ollama pull llama3"
        )
    
    def chat(self, messages: list, **kwargs) -> str:
        """Chat completion with automatic retries."""
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": kwargs.get("temperature", 0.7),
                "num_predict": kwargs.get("max_tokens", 1024)
            }
        }
        
        for attempt in range(self.MAX_RETRIES):
            try:
                resp = requests.post(url, json=payload, timeout=120)
                resp.raise_for_status()
                data = resp.json()
                self._failure_count = 0
                return data.get("message", {}).get("content", "")
                
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                if attempt < self.MAX_RETRIES - 1:
                    import time as t
                    t.sleep(self.RETRY_DELAY * (attempt + 1))
                    continue
                    
            except Exception as e:
                return self._graceful_fallback(str(e))
        
        return self._graceful_fallback("Connection failed after retries")
    
    def is_available(self) -> bool:
        """Check if Ollama server is running with caching."""
        import time as t
        now = t.time()
        
        # Cache availability check for 30 seconds
        if self._is_available_cache is not None and now - self._cache_time < 30:
            return self._is_available_cache
        
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=10)
            self._is_available_cache = resp.status_code == 200
        except:
            self._is_available_cache = False
        
        self._cache_time = now
        return self._is_available_cache
    
    def list_models(self) -> list:
        """List available models in Ollama."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return [m.get("name", "") for m in data.get("models", [])]
        except:
            return []
    
    def _graceful_fallback(self, error: str) -> str:
        """Return a helpful message instead of crashing."""
        if "Connection" in error or "refused" in error.lower():
            return (
                "[Ollama Unavailable] Cannot connect to Ollama service. "
                "Please ensure Ollama is running with 'ollama serve' or "
                "configure a cloud API (Google/OpenRouter) in Settings."
            )
        elif "timeout" in error.lower():
            return (
                "[Ollama Timeout] Request timed out. Ollama may be overloaded "
                "or the model is too large. Try a smaller model or use a cloud API."
            )
        else:
            return f"[Ollama Error] {error}. Please check Ollama logs or use a cloud API."


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
        self.base_url = base_url.rstrip('/')
        self.model = model

    def generate(self, prompt: str, **kwargs) -> str:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", 0.7)
        }
        
        try:
            resp = requests.post(
                url, 
                json=payload, 
                headers={"Authorization": f"Bearer {self.api_key}"}, 
                timeout=60
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            raise ValueError(f"Custom API Error: {e}")

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
            resp = requests.post(
                self.url, 
                json=payload, 
                headers={"Authorization": f"Bearer {self.api_key}"}, 
                timeout=60
            )
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


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

from typing import Optional
from modules.llm.adapters import (
    BaseLLMAdapter, 
    GoogleGeminiAdapter, 
    OpenRouterAdapter, 
    HuggingFaceAdapter, 
    CustomAdapter,
    ZhipuAdapter,
    OllamaAdapter
)

class LLMFactory:
    """Factory to create LLM Adapters based on configuration."""
    
    @staticmethod
    def get_adapter(provider: str, config: 'OrchestratorConfig') -> Optional[BaseLLMAdapter]:
        """
        Returns the appropriate adapter instance.
        
        Args:
            provider: 'google', 'openrouter', 'huggingface', 'custom', 'zhipu', 'ollama'
            config: OrchestratorConfig object with keys
            
        Returns:
            Initialized adapter or None if key missing
        """
        if provider == "google":
            if not config.google_key: return None
            return GoogleGeminiAdapter(config.google_key)
            
        elif provider == "openrouter":
            if not config.openrouter_key: return None
            # Use configured primary model if suitable, otherwise default
            model = config.primary_model if "mistral" in config.primary_model or "gpt" in config.primary_model else "mistralai/mistral-7b-instruct"
            return OpenRouterAdapter(config.openrouter_key, model=model)
            
        elif provider == "huggingface":
            if not config.huggingface_key: return None
            return HuggingFaceAdapter(config.huggingface_key)
            
        elif provider == "custom":
            if not config.custom_key or not config.custom_base_url: return None
            return CustomAdapter(config.custom_key, config.custom_base_url, config.custom_model)

        elif provider == "zhipu":
             if not config.glm_key: return None
             return ZhipuAdapter(config.glm_key)
        
        elif provider == "ollama":
            # Ollama doesn't require an API key - just URL and model
            ollama_url = getattr(config, 'ollama_url', 'http://localhost:11434')
            ollama_model = getattr(config, 'ollama_model', '') or ''
            
            # Auto-detect model if not configured
            if not ollama_model:
                ollama_model = LLMFactory._detect_first_ollama_model(ollama_url)
            
            if not ollama_model:
                return None  # No models available
            
            return OllamaAdapter(base_url=ollama_url, model=ollama_model)
            
        elif provider == "lm_studio":
            # LM Studio exposes an OpenAI-compatible API
            lm_studio_url = getattr(config, 'lm_studio_url', 'http://localhost:1234/v1')
            # Model name often doesn't matter for local single-model loaders, but we pass it if set
            model = getattr(config, 'lm_studio_model', 'local-model')
            return CustomAdapter(api_key="lm-studio", base_url=lm_studio_url, model=model)

        return None
    
    @staticmethod
    def _detect_first_ollama_model(base_url: str) -> str:
        """Auto-detect the first available Ollama model."""
        import requests
        try:
            resp = requests.get(f"{base_url}/api/tags", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("models", [])
                if models:
                    model_name = models[0].get("name", "")
                    import logging
                    logging.getLogger("llm_factory").info(f"Auto-detected Ollama model: {model_name}")
                    return model_name
        except Exception as e:
            import logging
            logging.getLogger("llm_factory").warning(f"Failed to auto-detect Ollama model: {e}")
        return ""



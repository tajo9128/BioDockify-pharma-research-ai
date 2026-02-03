from typing import Optional
from modules.llm.adapters import (
    BaseLLMAdapter, 
    GoogleGeminiAdapter, 
    OpenRouterAdapter, 
    HuggingFaceAdapter, 
    CustomAdapter,
    ZhipuAdapter,
    LMStudioAdapter
)

class LLMFactory:
    """Factory to create LLM Adapters based on configuration."""
    
    @staticmethod
    def get_adapter(provider: str, config: 'OrchestratorConfig') -> Optional[BaseLLMAdapter]:
        """
        Returns the appropriate adapter instance.
        
        Args:
            provider: 'google', 'openrouter', 'huggingface', 'custom', 'zhipu', 'lm_studio'
            config: OrchestratorConfig object with keys
            
        Returns:
            Initialized adapter or None if key missing
        """
        if provider == "google":
            if not config.google_key: return None
            return GoogleGeminiAdapter(config.google_key)
            
        elif provider == "openrouter":
            if not config.openrouter_key: return None
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
            
        elif provider == "lm_studio":
            # Use dedicated LM Studio adapter
            lm_studio_url = getattr(config, 'lm_studio_url', 'http://localhost:1234/v1/models')
            model = getattr(config, 'lm_studio_model', 'auto')
            # If config has old default 'local-model', switch to 'auto' for upgrade
            if model == 'local-model':
                model = 'auto'
            return LMStudioAdapter(base_url=lm_studio_url, model=model)

        return None
    




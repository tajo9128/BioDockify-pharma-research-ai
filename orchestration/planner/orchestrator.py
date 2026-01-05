"""
Research Orchestrator - Zero-Cost Pharma Research AI
Handles research planning and task decomposition with hybrid AI logic.
"""

import json
from typing import List, Optional
from dataclasses import dataclass

import requests
from pydantic import BaseModel, Field


# =============================================================================
# Configuration Models
# =============================================================================

# =============================================================================
# Configuration Models
# =============================================================================

class OrchestratorConfig(BaseModel):
    """Configuration for the Research Orchestrator."""
    
    # 1. AI Provider Settings
    use_cloud_api: bool = Field(default=False)
    ollama_host: str = Field(default="http://localhost:11434")
    ollama_model: str = Field(default="llama2")
    cloud_api_url: Optional[str] = Field(default=None)
    cloud_api_key: Optional[str] = Field(default=None)
    
    # Expanded Provider Support
    primary_model: str = Field(default="google")
    google_key: Optional[str] = Field(default=None)
    openrouter_key: Optional[str] = Field(default=None)
    huggingface_key: Optional[str] = Field(default=None)
    pubmed_email: Optional[str] = Field(default=None)
    
    # 2. Research Context (Section A)
    project_name: str = Field(default="My PhD Research")
    research_type: str = Field(default="PhD Thesis")
    disease_context: str = Field(default="General")
    research_stage: str = Field(default="Literature Review")
    
    # 3. Agent AI Behavior (Section B)
    agent_mode: str = Field(default="semi-autonomous")
    reasoning_depth: str = Field(default="standard")
    self_correction: bool = Field(default=True)
    max_retries: int = Field(default=3)
    failure_policy: str = Field(default="ask_user")
    
    # 4. Literature Config (Section C)
    literature_sources: List[str] = Field(default=["pubmed", "europe_pmc"])
    year_range: int = Field(default=10)
    novelty_strictness: str = Field(default="medium")

    timeout: int = Field(default=30)
    
    # User Persona (Added for Perplexity-Like Logic)
    user_persona: dict = Field(default_factory=dict)


# =============================================================================
# Research Planning Models
# =============================================================================

class ResearchStep(BaseModel):
    """Individual step in a research plan."""
    
    step_id: int = Field(..., description="Unique step identifier")
    title: str = Field(..., description="Step title")
    description: str = Field(..., description="Detailed step description")
    category: str = Field(
        ...,
        description="Category: literature_search, entity_extraction, "
                   "molecular_analysis, graph_building, etc."
    )
    dependencies: List[int] = Field(
        default_factory=list,
        description="List of step IDs this step depends on"
    )
    estimated_time_minutes: Optional[int] = Field(
        default=None,
        description="Estimated time in minutes"
    )


class ResearchPlan(BaseModel):
    """Complete research plan with structured steps."""
    
    research_title: str = Field(..., description="Original research title")
    objectives: List[str] = Field(
        default_factory=list,
        description="Research objectives"
    )
    steps: List[ResearchStep] = Field(
        default_factory=list,
        description="Ordered research steps"
    )
    total_estimated_time_minutes: Optional[int] = Field(
        default=None,
        description="Total estimated time in minutes"
    )


# =============================================================================
# Research Orchestrator Class
# =============================================================================

class ResearchOrchestrator:
    """
    Orchestrates research planning and task decomposition.
    Supports hybrid AI logic: local Ollama or cloud API.
    """
    
    # Predefined research step categories
    STEP_CATEGORIES = [
        "literature_search",
        "entity_extraction",
        "molecular_analysis",
        "graph_building",
        "data_analysis",
        "synthesis_planning",
        "literature_review",
        "final_report"
    ]
    
    def __init__(self, config: Optional[OrchestratorConfig] = None):
        """
        Initialize the Research Orchestrator.
        Loads runtime configuration to determine Hybrid Mode (Cloud vs Local).
        """
        # 1. Load Runtime Config from Disk if not provided or incomplete
        from runtime.config_loader import load_config
        runtime_cfg = load_config()
        
        if config:
            self.config = config
        else:
            # BUILD FULL CONFIG FROM DISK
            # Mapping Settings Specification -> Orchestrator Config
            
            # Section A: Project
            project = runtime_cfg.get("project", {})
            
            # Section B: Agent
            agent = runtime_cfg.get("agent", {})
            
            # Section C: Literature
            lit = runtime_cfg.get("literature", {})
            
            # Section E: API & AI
            ai = runtime_cfg.get("ai_provider", {})
            use_hybrid = (ai.get("mode") == "hybrid")
            self.config = OrchestratorConfig(
                # AI Settings
                use_cloud_api=use_hybrid,
                # cloud_api_key removed (legacy)
                primary_model=ai.get("primary_model", "google"),
                google_key=ai.get("google_key"),
                openrouter_key=ai.get("openrouter_key"),
                huggingface_key=ai.get("huggingface_key"),
                
                pubmed_email=ai.get("pubmed_email"),
                
                # Context
                project_name=project.get("name", "PhD Research"),
                research_type=project.get("type", "Thesis"),
                disease_context=project.get("disease_context", "General"),
                research_stage=project.get("stage", "Review"),
                
                # Behavior
                agent_mode=agent.get("mode", "semi-autonomous"),
                reasoning_depth=agent.get("reasoning_depth", "standard"),
                self_correction=agent.get("self_correction", True),
                
                # Literature
                literature_sources=lit.get("sources", []),
                year_range=lit.get("year_range", 10),
                novelty_strictness=lit.get("novelty_strictness", "medium")
            )
            
        if self.config.use_cloud_api and self.config.cloud_api_key:
            print(f"[+] Hybrid Mode Enabled: Using Cloud API")
        else:
            print(f"[*] Offline Mode: Using Local Ollama at {self.config.ollama_host}")
    
    # -------------------------------------------------------------------------
    # Main Planning Method
    # -------------------------------------------------------------------------
    
    def plan_research(self, title: str, mode: str = "synthesize") -> ResearchPlan:
        """
        Decompose a research title into a structured research plan.
        Respects Mode Enforcement and Citation Lock rules.
        
        Args:
            title: Research title/topic
            mode: search | synthesize | write
            
        Returns:
            ResearchPlan with structured steps
        """
        print(f"\n{'='*60}")
        print(f"Planning Research: {title} [Mode: {mode.upper()}]")
        print(f"{'='*60}")
        
        # 1. Mode Enforcement & Intent Check
        if mode not in ["search", "synthesize", "write"]:
            mode = "synthesize" # Fallback default
            
        # 2. Generate plan using configured AI backend
        if self.config.use_cloud_api:
            plan_data = self._generate_plan_hybrid(title, mode)
        else:
            plan_data = self._generate_plan_local(title, mode)
        
        # Create ResearchPlan from generated data
        plan = ResearchPlan(
            research_title=title,
            objectives=plan_data.get("objectives", []),
            steps=[ResearchStep(**step) for step in plan_data.get("steps", [])],
            total_estimated_time_minutes=plan_data.get("total_estimated_time")
        )
        
        print(f"[+] Generated {len(plan.steps)} research steps")
        
        # 4. Citation Lock / Novelty Gate (Logic Rule #2 & #4)
        strictness = self.config.user_persona.get("strictness", "balanced")
        if strictness == "conservative" and mode == "write":
            # For writing in conservative mode, we MUST have evidence first.
            # If this is a fresh start (step 1 is not verification), inject a gate.
            if plan.steps and "literature" not in plan.steps[0].category:
                print("[!] Citation Lock Enforced: Injecting mandatory verification step.")
                verification_step = ResearchStep(
                    step_id=0,
                    title="Mandatory Evidence Verification",
                    description="Verify existence of sufficient high-quality sources before drafting.",
                    category="literature_search",
                    dependencies=[],
                    estimated_time_minutes=15
                )
                plan.steps.insert(0, verification_step)
                # Adjust IDs of subsequent steps
                for s in plan.steps[1:]:
                    s.step_id += 1
                    s.dependencies = [d+1 for d in s.dependencies]
                    if s.step_id == 1: s.dependencies.append(0)
                    
        return plan
    
    # -------------------------------------------------------------------------
    # Local Ollama Implementation
    # -------------------------------------------------------------------------
    
    def _generate_plan_local(self, title: str, mode: str) -> dict:
        """
        Generate research plan using local Ollama instance.
        """
        prompt = self._build_prompt(title, mode)
        
        try:
            response = requests.post(
                f"{self.config.ollama_host}/api/generate",
                json={
                    "model": self.config.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.7
                },
                timeout=self.config.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            plan_text = result.get("response", "")
            
            # Parse the response
            plan_data = self._parse_plan_response(plan_text)
            
            return plan_data
            
        except requests.exceptions.Timeout:
            print("[!] Request timeout, using fallback plan")
            return self._generate_fallback_plan(title)
        except requests.exceptions.ConnectionError:
            print("[!] Connection error, using fallback plan")
            return self._generate_fallback_plan(title)
        except Exception as e:
            print(f"[!] Error generating plan: {e}")
            return self._generate_fallback_plan(title)
    
    def _build_prompt(self, title: str, mode: str = "synthesize") -> str:
        """
        Build the prompt for Ollama with Persona Injection AND Mode Enforcement.
        """
        # Extract Persona
        role = self.config.user_persona.get("role", "researcher").replace("_", " ")
        strictness = self.config.user_persona.get("strictness", "balanced")
        purpose = ", ".join(self.config.user_persona.get("primary_purpose", ["general"]))
        
        # Base Persona Instruction
        system_instruction = f"You are a pharmaceutical research planner acting as a senior assistant to a {role}."
        
        # MODE ENFORCEMENT (Logic Rule #3)
        mode_instruction = ""
        if mode == "search":
            mode_instruction = "MODE: SEARCH. Focus ONLY on retrieving, listing, and summarizing existing literature. Do not attempt synthesis or hypothesis generation yet."
        elif mode == "synthesize":
            mode_instruction = "MODE: SYNTHESIZE. Focus on connecting dot, building knowledge graphs, and identifying patterns across sources. Prioritize 'graph_building' and 'data_analysis' steps."
        elif mode == "write":
            mode_instruction = "MODE: WRITE. Focus on structuring a final specific output (review, report, or chapter). Ensure steps encompass outlining, drafting, and citation verification."
            
        # Strictness & Context
        if strictness == "conservative":
            system_instruction += " You must be extremely rigorous. Avoid speculative steps."
        elif strictness == "exploratory":
            system_instruction += " You are encouraged to include novel, hypothesis-generating steps."
        
        context_instruction = f"User Goal: {purpose}. {mode_instruction}"

        prompt = f"""{system_instruction}
{context_instruction}

Create a detailed research plan for: "{title}"

Generate a plan with 4-8 steps strictly adhering to the {mode.upper()} mode.

Return JSON format:
{{
  "objectives": ["Objective 1", "Objective 2"],
  "steps": [
    {{
       "step_id": 1,
       "title": "Step Title",
       "description": "Actionable description",
       "category": "literature_search|entity_extraction|graph_building|data_analysis|synthesis_planning|literature_review|final_report",
       "dependencies": [],
       "estimated_time_minutes": 30
    }}
  ],
  "total_estimated_time": 120
}}

Provide ONLY the JSON."""
        
        return prompt
    
    def _parse_plan_response(self, response_text: str) -> dict:
        """
        Parse the AI response into plan data.
        
        Args:
            response_text: AI response text
            
        Returns:
            Parsed plan dictionary
        """
        try:
            # Try to extract JSON from response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                plan_data = json.loads(json_str)
                return plan_data
            else:
                raise ValueError("No JSON found in response")
                
        except json.JSONDecodeError:
            print("⚠ Failed to parse JSON, using fallback plan")
            return self._generate_fallback_plan("Unknown Title")
    
    # -------------------------------------------------------------------------
    # Cloud API Implementation (Placeholder)
    # -------------------------------------------------------------------------
    
    # -------------------------------------------------------------------------
    # Hybrid API Implementation with Fallback Logic
    # -------------------------------------------------------------------------
    
    def _generate_plan_hybrid(self, title: str) -> dict:
        """
        Generate research plan using Cloud APIs with Fallback.
        Strategy: Primary -> Secondary -> Tertiary -> Local/Fallback
        """
        # 1. Define Priority Order
        # We start with the user's selected primary, then try others if keys exist
        available_providers = []
        
        # Add Primary First
        if self.config.primary_model in ["google", "openrouter", "huggingface"]:
            available_providers.append(self.config.primary_model)
        
        # Add others as backup
        candidates = ["google", "openrouter", "huggingface"]
        for c in candidates:
            if c != self.config.primary_model:
                available_providers.append(c)
                
        print(f"[*] Research Planner Strategy: {available_providers}")
        
        for provider in available_providers:
            try:
                api_key = self._get_key_for_provider(provider)
                if not api_key:
                    # print(f"[-] Skipping {provider} (No Key)")
                    continue
                    
                print(f"[*] Attempting generation with: {provider.upper()}")
                
                # router logic
                if provider == "google":
                    plan = self._call_google_gemini(api_key, title)
                elif provider == "openrouter":
                    plan = self._call_openrouter(api_key, title)
                elif provider == "huggingface":
                    plan = self._call_huggingface(api_key, title)
                else:
                    continue
                    
                if plan:
                    print(f"[+] Successfully generated plan using {provider.upper()}")
                    return plan
                    
            except Exception as e:
                print(f"[!] Provider {provider} failed: {e}")
                # Log usage limit specific errors
                if "429" in str(e):
                    print(f"⚠ Rate Limit Hit for {provider}. Switching to next provider...")
                continue # Try next provider
        
        print("[!] All cloud providers failed. Using offline fallback.")
        return self._generate_fallback_plan(title)

    def _get_key_for_provider(self, provider: str) -> Optional[str]:
        if provider == "google": return self.config.google_key
        if provider == "openrouter": return self.config.openrouter_key
        if provider == "huggingface": return self.config.huggingface_key
        if provider == "openai": return self.config.cloud_api_key
        return None

    def _call_google_gemini(self, key: str, title: str) -> dict:
        """Call Google Gemini API via REST."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={key}"
        prompt = self._build_prompt(title)
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        resp.raise_for_status()
        
        # Parse Gemini Response
        data = resp.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return self._parse_plan_response(text)
        except (KeyError, IndexError):
            raise ValueError("Invalid response format from Gemini")

    def _call_openrouter(self, key: str, title: str) -> dict:
        """Call OpenRouter API."""
        url = "https://openrouter.ai/api/v1/chat/completions"
        prompt = self._build_prompt(title)
        payload = {
            "model": "mistralai/mistral-7b-instruct", # Default cheap/fast model
            "messages": [{"role": "user", "content": prompt}]
        }
        
        resp = requests.post(url, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=30)
        resp.raise_for_status()
        
        data = resp.json()
        text = data["choices"][0]["message"]["content"]
        return self._parse_plan_response(text)

    def _call_huggingface(self, key: str, title: str) -> dict:
        """Call HuggingFace Inference API."""
        # Using Mixtral as it's solid for planning
        url = "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1"
        prompt = self._build_prompt(title)
        # HF API takes raw string for text-generation
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": 1024, "return_full_text": False}}
        
        resp = requests.post(url, json=payload, headers={"Authorization": f"Bearer {key}"}, timeout=30)
        resp.raise_for_status()
        
        data = resp.json()
        # HF returns list of dicts
        text = data[0]["generated_text"]
        return self._parse_plan_response(text)
    
    # -------------------------------------------------------------------------
    # Fallback Plan Generation
    # -------------------------------------------------------------------------
    
    def _generate_fallback_plan(self, title: str) -> dict:
        """
        Generate a generic fallback plan when AI fails.
        
        Args:
            title: Research title
            
        Returns:
            Dictionary with plan data
        """
        return {
            "objectives": [
                f"Conduct comprehensive literature review on {title}",
                "Extract relevant biomedical entities and relationships",
                "Analyze molecular structures and properties",
                "Generate actionable research insights"
            ],
            "steps": [
                {
                    "step_id": 1,
                    "title": "Literature Search",
                    "description": f"Search scientific databases for papers related to {title}",
                    "category": "literature_search",
                    "dependencies": [],
                    "estimated_time_minutes": 60
                },
                {
                    "step_id": 2,
                    "title": "Entity Extraction",
                    "description": "Extract named entities (drugs, proteins, diseases) from literature",
                    "category": "entity_extraction",
                    "dependencies": [1],
                    "estimated_time_minutes": 45
                },
                {
                    "step_id": 3,
                    "title": "Molecular Analysis",
                    "description": "Analyze molecular structures and chemical properties",
                    "category": "molecular_analysis",
                    "dependencies": [2],
                    "estimated_time_minutes": 90
                },
                {
                    "step_id": 4,
                    "title": "Knowledge Graph Construction",
                    "description": "Build knowledge graph from extracted entities and relationships",
                    "category": "graph_building",
                    "dependencies": [2, 3],
                    "estimated_time_minutes": 60
                },
                {
                    "step_id": 5,
                    "title": "Data Analysis",
                    "description": "Perform statistical and network analysis on research data",
                    "category": "data_analysis",
                    "dependencies": [4],
                    "estimated_time_minutes": 75
                },
                {
                    "step_id": 6,
                    "title": "Literature Review",
                    "description": "Synthesize findings and generate comprehensive review",
                    "category": "literature_review",
                    "dependencies": [5],
                    "estimated_time_minutes": 90
                },
                {
                    "step_id": 7,
                    "title": "Final Report Generation",
                    "description": "Generate final research report with insights and recommendations",
                    "category": "final_report",
                    "dependencies": [6],
                    "estimated_time_minutes": 60
                }
            ],
            "total_estimated_time": 480
        }


# =============================================================================
# Example Usage
# =============================================================================

if __name__ == "__main__":
    # Example 1: Using local Ollama
    print("\n=== Example 1: Local Ollama ===")
    config_local = OrchestratorConfig(
        use_cloud_api=False,
        ollama_host="http://localhost:11434",
        ollama_model="llama2"
    )
    
    orchestrator = ResearchOrchestrator(config=config_local)
    plan = orchestrator.plan_research(
        "Novel inhibitors for COVID-19 main protease"
    )
    
    print(f"\nObjectives:")
    for obj in plan.objectives:
        print(f"  - {obj}")
    
    print(f"\nSteps:")
    for step in plan.steps:
        deps = f" (depends on: {step.dependencies})" if step.dependencies else ""
        print(f"  {step.step_id}. {step.title}{deps}")
        print(f"     Category: {step.category}")
        print(f"     Time: {step.estimated_time_minutes} min")
    
    print(f"\nTotal Estimated Time: {plan.total_estimated_time_minutes} minutes")
    
    # Example 2: Using cloud API (placeholder)
    print("\n\n=== Example 2: Cloud API (Placeholder) ===")
    config_cloud = OrchestratorConfig(
        use_cloud_api=True,
        cloud_api_url="https://api.example.com/research/plan",
        cloud_api_key="your-api-key-here"
    )
    
    orchestrator_cloud = ResearchOrchestrator(config=config_cloud)
    plan_cloud = orchestrator_cloud.plan_research(
        "Antibiotic resistance mechanisms in MRSA"
    )
    
    print(f"Generated {len(plan_cloud.steps)} steps for cloud API")

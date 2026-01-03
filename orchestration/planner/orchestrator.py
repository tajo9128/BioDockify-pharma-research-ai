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

class OrchestratorConfig(BaseModel):
    """Configuration for the Research Orchestrator."""
    
    use_cloud_api: bool = Field(
        default=False,
        description="Whether to use cloud API or local Ollama"
    )
    ollama_host: str = Field(
        default="http://localhost:11434",
        description="Local Ollama instance URL"
    )
    ollama_model: str = Field(
        default="llama2",
        description="Ollama model to use"
    )
    cloud_api_url: Optional[str] = Field(
        default=None,
        description="Cloud API endpoint URL (placeholder)"
    )
    cloud_api_key: Optional[str] = Field(
        default=None,
        description="Cloud API key (placeholder)"
    )
    timeout: int = Field(
        default=30,
        description="Request timeout in seconds"
    )


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
        # 1. Load Runtime Config
        from runtime.config_loader import load_config
        runtime_cfg = load_config()
        api_keys = runtime_cfg.get("api_keys", {})
        
        # 2. Determine Mode
        openai_key = api_keys.get("openai_key")
        use_cloud = bool(openai_key and openai_key.strip())
        
        # 3. Initialize Config
        if config:
            self.config = config
        else:
            self.config = OrchestratorConfig(
                use_cloud_api=use_cloud,
                cloud_api_key=openai_key,
                # Keep defaults for local
            )
            
        if self.config.use_cloud_api:
            print(f"[+] Hybrid Mode Enabled: Using Cloud API (Key found)")
        else:
            print(f"[*] Offline Mode: Using Local Ollama at {self.config.ollama_host}")
    
    # -------------------------------------------------------------------------
    # Main Planning Method
    # -------------------------------------------------------------------------
    
    def plan_research(self, title: str) -> ResearchPlan:
        """
        Decompose a research title into a structured research plan.
        
        Args:
            title: Research title/topic
            
        Returns:
            ResearchPlan with structured steps
        """
        print(f"\n{'='*60}")
        print(f"Planning Research: {title}")
        print(f"{'='*60}")
        
        # Generate plan using configured AI backend
        if self.config.use_cloud_api:
            plan_data = self._generate_plan_cloud(title)
        else:
            plan_data = self._generate_plan_local(title)
        
        # Create ResearchPlan from generated data
        plan = ResearchPlan(
            research_title=title,
            objectives=plan_data.get("objectives", []),
            steps=[ResearchStep(**step) for step in plan_data.get("steps", [])],
            total_estimated_time_minutes=plan_data.get("total_estimated_time")
        )
        
        print(f"[+] Generated {len(plan.steps)} research steps")
        return plan
    
    # -------------------------------------------------------------------------
    # Local Ollama Implementation
    # -------------------------------------------------------------------------
    
    def _generate_plan_local(self, title: str) -> dict:
        """
        Generate research plan using local Ollama instance.
        
        Args:
            title: Research title
            
        Returns:
            Dictionary with plan data
        """
        prompt = self._build_prompt(title)
        
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
    
    def _build_prompt(self, title: str) -> str:
        """
        Build the prompt for Ollama.
        
        Args:
            title: Research title
            
        Returns:
            Formatted prompt string
        """
        prompt = f"""You are a pharmaceutical research planner. Create a detailed research plan for the following title:

Research Title: {title}

Generate a research plan with these steps:
1. Literature Search
2. Entity Extraction (Bio-NER)
3. Molecular Analysis
4. Knowledge Graph Construction
5. Data Analysis
6. Synthesis Planning
7. Literature Review
8. Final Report Generation

For each step, provide:
- step_id (1-8)
- title
- description
- category (use: literature_search, entity_extraction, molecular_analysis, 
           graph_building, data_analysis, synthesis_planning, literature_review, final_report)
- dependencies (list of step IDs this step depends on)
- estimated_time_minutes

Return the plan in JSON format with these keys:
- objectives: list of 3-5 research objectives
- steps: list of step objects
- total_estimated_time: total time in minutes

Example format:
{{
  "objectives": ["Objective 1", "Objective 2"],
  "steps": [...],
  "total_estimated_time": 480
}}

Provide ONLY the JSON, no other text."""
        
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
    
    def _generate_plan_cloud(self, title: str) -> dict:
        """
        Generate research plan using cloud API (placeholder).
        
        Args:
            title: Research title
            
        Returns:
            Dictionary with plan data
        """
        print("Using cloud API for research planning...")
        
        # TODO: Implement actual cloud API call
        # For now, use fallback
        return self._generate_fallback_plan(title)
    
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

"""
PhD Planner - Research Progression and Tool Selection
Ported from Agent Zero original core.
"""

import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class PhDPlanner:
    """
    Planner for PhD research progression and tool selection.
    Determines current stage and recommends appropriate tools.
    """

    # Tools commonly used at each PhD stage
    STAGE_TOOLS = {
        'proposal': [
            'literature_landscape',
            'gap_detection',
            'novelty_scoring',
            'reference_management',
            'topic_exploration'
        ],
        'early': [
            'literature_review',
            'hypothesis_generation',
            'methodology_design',
            'experimental_planning',
            'feasibility_analysis'
        ],
        'mid': [
            'docking_execution',
            'md_simulation',
            'result_analysis',
            'data_visualization',
            'experiment_tracking'
        ],
        'late': [
            'data_synthesis',
            'discussion_writing',
            'limitation_analysis',
            'figure_generation',
            'result_validation'
        ],
        'submission': [
            'chapter_assembly',
            'citation_formatting',
            'viva_preparation',
            'manuscript_preparation',
            'peer_review_simulation'
        ]
    }

    # Detailed descriptions of each stage
    STAGE_DESCRIPTIONS = {
        'proposal': """
The initial stage where the research topic is defined.
Focus areas: literature review, gap detection, hypothesis formulation.
        """,
        'early': """
The beginning phase of active research.
Focus areas: finalized methodology, experimental setup, initial data.
        """,
        'mid': """
The core research phase with active experimentation.
Focus areas: execution of main simulations/experiments, result analysis.
        """,
        'late': """
The synthesis and writing phase.
Focus areas: synthesizing findings, writing chapters, figure generation.
        """,
        'submission': """
Final preparation before thesis defense.
Focus areas: assembly, formatting, viva preparation.
        """
    }

    def __init__(self):
        """Initialize the PhD Planner."""
        pass

    def detect_phd_stage(self, project_metadata: Optional[Dict] = None) -> str:
        """Automatically detect PhD stage from project state."""
        if not project_metadata:
            return 'proposal'

        # Check explicit stage indicator
        if 'phd_stage' in project_metadata:
            explicit_stage = project_metadata['phd_stage'].lower()
            if explicit_stage in self.STAGE_TOOLS:
                return explicit_stage

        # Detection based on project milestones
        milestones = project_metadata.get('milestones', {})
        if not milestones.get('literature_review_complete', False):
            return 'proposal'
        if not milestones.get('experiments_started', False):
            return 'early'
        if not milestones.get('experiments_complete', False):
            return 'mid'
        if not milestones.get('thesis_started', False):
            return 'late'

        return 'submission'

    def detect_phd_stage_from_timeline(self, start_date: Optional[str] = None, total_duration_years: int = 4) -> str:
        """Detect PhD stage based on timeline."""
        if not start_date:
            return 'proposal'

        try:
            start = datetime.fromisoformat(start_date)
            elapsed = (datetime.now() - start).total_seconds() / (365.25 * 24 * 3600)

            if elapsed < 0.2 * total_duration_years:
                return 'proposal'
            elif elapsed < 0.4 * total_duration_years:
                return 'early'
            elif elapsed < 0.75 * total_duration_years:
                return 'mid'
            elif elapsed < 0.95 * total_duration_years:
                return 'late'
            else:
                return 'submission'
        except (ValueError, TypeError):
            return 'proposal'

    def recommend_tools(self, goal: str, stage: str, available_tools: Optional[List[str]] = None) -> List[str]:
        """Simple tool recommendation based on stage and keywords."""
        stage_specific = self.STAGE_TOOLS.get(stage, [])
        if available_tools:
            stage_specific = [t for t in stage_specific if t in available_tools]

        # Scoring based on keyword matching
        goal_lower = goal.lower()
        keywords = re.findall(r'\b\w+\b', goal_lower)
        
        scored_tools = []
        for tool in stage_specific:
            score = sum(1 for kw in keywords if kw in tool.lower())
            scored_tools.append((tool, score))
            
        scored_tools.sort(key=lambda x: x[1], reverse=True)
        return [t for t, s in scored_tools if s > 0] or stage_specific[:3]

    def get_stage_description(self, stage: str) -> str:
        return self.STAGE_DESCRIPTIONS.get(stage, 'Unknown stage')

    def get_all_stages(self) -> List[str]:
        return list(self.STAGE_TOOLS.keys())

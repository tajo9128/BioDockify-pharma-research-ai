"""
BioDockify Academic Compliance Module
The "Conscience" of the agent. Enforces Citation Locks, Academic Tone, and Safety Gates.
"""

import re
import logging
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ComplianceReport:
    passed: bool
    score: float
    issues: List[str]
    citations_count: int

class AcademicComplianceEngine:
    """
    Enforces 'Pharma-Grade' rules on agent output.
    """
    
    def __init__(self, strictness: str = "high"):
        self.strictness = strictness # low, medium, high
        # Tokens that signal overconfidence or unscientific hype
        self.hype_tokens = [
            "proves", "undoubtedly", "game-changer", "miracle", "obviously", 
            "perfect", "guaranteed", "revolutionary"
        ]
        
    def verify_evidence_threshold(self, text: str, sources: List[Dict]) -> ComplianceReport:
        """
        CITATION LOCK: Blocks output if insufficient evidence is present.
        """
        citations_found = len(sources)
        min_required = 3 if self.strictness == "high" else 1
        
        issues = []
        if citations_found < min_required:
            issues.append(f"Insufficient Sources: Found {citations_found}, Need {min_required}")
            return ComplianceReport(False, 0.0, issues, citations_found)
            
        # Check if text actually references the sources (simple bracket check [1])
        # This is basic; a real implementation would map [1] to sources list.
        ref_pattern = r"\[\d+\]|\[.*?20\d{2}.*?\]"
        in_text_refs = len(re.findall(ref_pattern, text))
        
        if in_text_refs == 0 and citations_found > 0:
            issues.append("Orphaned Evidence: Sources provided but not cited in text.")
            return ComplianceReport(False, 0.5, issues, citations_found)
            
        return ComplianceReport(True, 1.0, [], citations_found)

    def check_academic_tone(self, text: str) -> List[str]:
        """
        scans for 'Reviewer Triggers' - words that sound unscientific.
        Returns list of warnings.
        """
        warnings = []
        lower_text = text.lower()
        
        for token in self.hype_tokens:
            if token in lower_text:
                warnings.append(f"Avoid overconfident term: '{token}'. Use 'suggests' or 'indicates'.")
                
        # Check for first-person usage (I, me, my) in formal sections
        if re.search(r"\b(i|me|my)\b", lower_text):
            warnings.append("Avoid first-person pronouns (I/me) in objective reporting.")
            
        return warnings

    def detect_contradictions(self, source_a_summary: str, source_b_summary: str) -> Optional[str]:
        """
        Simple keyword-based contradiction flagger.
        In production, this would use an NLI model.
        """
        # Very distinct negation markers in close proximity to same entities?
        # Placeholder for LLM-based logic (which would be handled by Orchestrator calling LLM).
        # This function signals WHERE to look.
        return None

    def generate_disclosure(self, model_name: str) -> str:
        """Generates standard AI disclosure statement."""
        return (
            f"**Declaration of AI Usage**: This report was assisted by BioDockify ({model_name}) "
            "for literature retrieval and initial drafting. All scientific claims were verified "
            "against the cited primary sources, and the final text was reviewed and approved by the author."
        )

if __name__ == "__main__":
    engine = AcademicComplianceEngine()
    dummy_text = "This result proves that the drug is a miracle cure."
    warnings = engine.check_academic_tone(dummy_text)
    print(f"Tone Check: {warnings}")
    
    report = engine.verify_evidence_threshold("Some claim.", [])
    print(f"Lock Check: {report}")

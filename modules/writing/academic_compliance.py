
import re
import statistics
from typing import List, Dict, Any, Optional

class AcademicComplianceEngine:
    """
    Ensures scientific outputs are permissible, evidence-grounded, and human-reviewed.
    Strictly enforcing 'Academic Integrity' principles.
    """

    def __init__(self):
        # Academic phrase replacements (Generic AI -> Scientific)
        self.style_rules = {
            r"\b(In conclusion,)\b": "Collectively, these findings suggest",
            r"\b(It is important to note that)\b": "Notably,",
            r"\b(This study proves)\b": "These results demonstrate, within experimental limits,",
            r"\b(undoubtedly)\b": "strongly",
            r"\b(game-changer)\b": "significant advancement",
            r"\b(revolutionize)\b": "transform",
            r"\b(delve into)\b": "investigate",
            r"\b(comprehensive overview)\b": "systematic review",
        }
        
        # Regex for common citation patterns: (Smith et al., 2023) or [1] or [1-3]
        self.citation_pattern = re.compile(r"\(.*?, \d{4}\)|\[[\d,\- ]+\]")

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """ Run full compliance analysis on the text draft. """
        
        sentences = self._split_sentences(text)
        if not sentences:
            return self._empty_report()

        # 1. Style Normalization Check
        style_issues = self._check_style(text)
        
        # 2. Evidence Density Check
        evidence_score = self._check_evidence_density(sentences)
        
        # 3. Sentence Variability Check
        variability_score = self._check_sentence_variability(sentences)

        # Overall Compliance Status
        is_compliant = (
            len(style_issues) == 0 and 
            evidence_score >= 0.7 and 
            variability_score >= 0.5
        )

        return {
            "compliant": is_compliant,
            "scores": {
                "academic_tone": 1.0 - (len(style_issues) * 0.1), # Simple penalty
                "evidence_density": evidence_score,
                "variability": variability_score
            },
            "issues": style_issues,
            "metrics": {
                "sentence_count": len(sentences),
                "citation_count": self._count_citations(text)
            }
        }

    def _check_style(self, text: str) -> List[Dict[str, str]]:
        issues = []
        for pattern, replacement in self.style_rules.items():
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                issues.append({
                    "type": "Tone",
                    "found": match.group(0),
                    "suggestion": replacement,
                    "context": text[max(0, match.start()-20):min(len(text), match.end()+20)]
                })
        return issues

    def _check_evidence_density(self, sentences: List[str]) -> float:
        """ Ratio of sentences with citations to total sentences. """
        cited_sentences = 0
        for sent in sentences:
            if self.citation_pattern.search(sent):
                cited_sentences += 1
        
        if not sentences: return 0.0
        return round(cited_sentences / len(sentences), 2)

    def _check_sentence_variability(self, sentences: List[str]) -> float:
        """ 
        Calculate variance in sentence length. 
        Higher variance = more human-like flow. 
        """
        if len(sentences) < 2: return 1.0 # Give pass for single sentence
        
        lengths = [len(sent.split()) for sent in sentences]
        try:
            stdev = statistics.stdev(lengths)
            mean = statistics.mean(lengths)
            # Coefficient of Variation (CV). Human writing usually has CV > 0.4
            cv = stdev / mean if mean > 0 else 0
            
            # Normalize score (0.0 to 1.0)
            score = min(cv * 2.5, 1.0) 
            return round(score, 2)
        except:
            return 0.5

    def _count_citations(self, text: str) -> int:
        return len(self.citation_pattern.findall(text))

    def _split_sentences(self, text: str) -> List[str]:
        # Basic split, can be improved with NLP lib
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    def _empty_report(self):
        return {
            "compliant": False,
            "scores": {"academic_tone": 0, "evidence_density": 0, "variability": 0},
            "issues": [],
            "metrics": {"sentence_count": 0, "citation_count": 0}
        }

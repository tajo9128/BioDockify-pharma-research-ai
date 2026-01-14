"""
PhD Thesis Validator
Checks for the existence of required research artifacts (proofs) before writing.
"""
import logging
import os
import json
from enum import Enum
from typing import Dict, List, Any

# We'll use the vector store or file system to check existence
# For this v1, checking specific file artifacts in user workspace is robust.

logger = logging.getLogger("thesis.validator")

class ProofStatus(str, Enum):
    VALID = "valid"
    MISSING = "missing"
    INCOMPLETE = "incomplete"

class ThesisValidator:
    def __init__(self, project_root: str = "."):
        self.project_root = project_root

    def validate_chapter_readiness(self, chapter_id: str) -> Dict[str, Any]:
        """
        Check if the system has enough data to write the requested chapter.
        Returns a status dict.
        """
        logger.info(f"Validating readiness for {chapter_id}...")
        
        # Mapping requirements to validation logic
        if chapter_id == "chapter_1": # Intro
            # Needs basic literature
            return self._check_citations_available()
            
        elif chapter_id == "chapter_2": # Lit Review
            return self._check_citations_available(min_count=20)
            
        elif chapter_id == "chapter_4": # Methods
            # Needs config files or protocol definitions
            return self._check_files_exist(["protocol.json", "config.yaml", "requirements.txt"], any_one=True)
            
        elif chapter_id == "chapter_5": # Results
            # Needs metrics or result data
            return self._check_files_exist(["results.json", "metrics.json", "analysis.csv"], any_one=True)
            
        elif chapter_id == "chapter_6": # Discussion
            # Needs results AND methods
            results = self.validate_chapter_readiness("chapter_5")
            methods = self.validate_chapter_readiness("chapter_4")
            if results['status'] == 'valid' and methods['status'] == 'valid':
                return {"status": "valid", "proofs": ["results", "methods"]}
            return {"status": "missing", "missing_items": ["results or methods dependency"]}
            
        return {"status": "valid", "message": "No strict proofs for this chapter yet."}

    def _check_citations_available(self, min_count: int = 5) -> Dict[str, Any]:
        """Check if we have enough papers in the library."""
        try:
            from modules.library.store import library_store
            files = library_store.list_files()
            # Crude approximation: PDFs = citations
            if len(files) >= min_count:
                 return {"status": "valid", "proof_count": len(files)}
            else:
                 return {
                     "status": "missing", 
                     "message": f"Insufficient literature. Need {min_count} papers, found {len(files)}.",
                     "current_count": len(files)
                 }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _check_files_exist(self, filenames: List[str], any_one: bool = False) -> Dict[str, Any]:
        """Check availability of specific artifact files."""
        found = []
        missing = []
        
        # We assume artifacts might be in root or 'data' or 'outputs'
        search_paths = [
            self.project_root,
            os.path.join(self.project_root, "data"),
            os.path.join(self.project_root, "outputs")
        ]
        
        for fname in filenames:
            is_found = False
            for path in search_paths:
                full_path = os.path.join(path, fname)
                if os.path.exists(full_path):
                    found.append(fname)
                    is_found = True
                    break
            if not is_found:
                missing.append(fname)
        
        if any_one:
            if found:
                return {"status": "valid", "found": found}
            return {"status": "missing", "missing_items": missing}
        else:
            if not missing:
                return {"status": "valid", "found": found}
            return {"status": "missing", "missing_items": missing}

thesis_validator = ThesisValidator()

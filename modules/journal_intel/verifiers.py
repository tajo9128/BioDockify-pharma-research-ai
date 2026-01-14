import json
import os
from typing import List, Optional
from urllib.parse import urlparse
from .models import JournalIdentity, PillarScore

class IndexVerifier:
    """Pillar 2: Authoritative Index Verification."""
    
    def __init__(self, data_dir: str = "data/integrity"):
        self.wos_db = self._load_json(os.path.join(data_dir, "wos_master_list.json"))
        # self.scopus_db already loaded implicitly or we load again. Simple load for now.
    
    def _load_json(self, path):
        if not os.path.exists(path): return []
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)

    def verify(self, identity: JournalIdentity) -> PillarScore:
        # Check WoS
        wos_entry = next((item for item in self.wos_db if item.get('issn') == identity.issn), None)
        
        indexes = []
        if wos_entry:
            indexes.extend(wos_entry.get('indexes', []))
            
        status = "PASS" if indexes else "FAIL" # simplified, strict check
        detail = f"Indexes found: {', '.join(indexes)}" if indexes else "No authoritative indexing found in local WoS DB."
        
        # We could also check Scopus here, but for this demo, WoS is our Gold Standard.
        
        return PillarScore(
            name="Authoritative Indexing",
            status=status,
            score=1.0 if status == "PASS" else 0.0,
            details=detail
        )

class FraudGuard:
    """Pillar 5: Fraud Intelligence & Pattern Matching."""
    
    def __init__(self, data_dir: str = "data/integrity"):
        self.hijack_db = self._load_json(os.path.join(data_dir, "hijacked_journals.json"))

    def _load_json(self, path):
        if not os.path.exists(path): return []
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)

    def _normalize_domain(self, url: str) -> str:
        """Extract and normalize domain from URL, handling URLs without schemes."""
        if not url:
            return ""
        # Ensure URL has a scheme for proper parsing
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        netloc = urlparse(url).netloc.lower()
        # Remove www. prefix
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        return netloc

    def check(self, issn: str, url: Optional[str]) -> PillarScore:
        # Check if ISSN is in hijacked list
        hijack_entry = next((item for item in self.hijack_db if item.get('issn') == issn), None)
        
        if hijack_entry:
            # Found in hijack DB. Now check URL if provided.
            if url:
                # Normalize domains
                input_domain = self._normalize_domain(url)
                fake_domain = self._normalize_domain(hijack_entry.get('fake_url', ''))
                auth_domain = self._normalize_domain(hijack_entry.get('authentic_url', ''))
                
                if input_domain == fake_domain:
                    return PillarScore(name="Fraud Intelligence", status="FAIL", score=0.0, details="CRITICAL: URL matches known hijacked domain.")
                elif input_domain == auth_domain:
                    return PillarScore(name="Fraud Intelligence", status="PASS", score=1.0, details="URL matches known authentic domain for this hijacked journal.")
                else:
                    return PillarScore(name="Fraud Intelligence", status="CAUTION", score=0.5, details="Journal is target of hijacking. Verify URL carefully.")
            
            return PillarScore(name="Fraud Intelligence", status="CAUTION", score=0.5, details="This journal ISSN is on the Hijacked Journal list. Proceed with extreme caution.")

        return PillarScore(name="Fraud Intelligence", status="PASS", score=1.0, details="No fraud reports found for this ISSN.")

class WebsiteAuthenticator:
    """Pillar 3/4: Official Website Authentication & Consistency."""
    
    def verify_consistency(self, identity: JournalIdentity, input_url: str) -> PillarScore:
        if not input_url:
             return PillarScore(name="Website Auth", status="SKIP", score=0.0, details="No URL provided for verification.")

        # Logic placeholder:
        # 1. Does URL domain look related to publisher?
        # e.g., Publisher "NATURE" -> url "nature.com" = PASS
        
        domain = urlparse(input_url).netloc.lower()
        publisher = identity.publisher.lower()
        
        # Very naive heuristic for demo
        publisher_parts = publisher.split(' ')
        match_count = sum(1 for p in publisher_parts if len(p) > 3 and p in domain)
        
        if match_count > 0:
             return PillarScore(name="Website Consistency", status="PASS", score=1.0, details=f"Domain {domain} seems consistent with publisher {identity.publisher}.")
        
        # Default to neutral/caution if no obvious match (conservative)
        return PillarScore(name="Website Consistency", status="CAUTION", score=0.5, details=f"Domain {domain} could not be automatically linked to {identity.publisher}. Manual check required.")

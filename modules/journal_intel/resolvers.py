import json
from typing import Optional, List, Dict
import os
from .models import JournalIdentity

class CanonicalResolver:
    """
    Pillar 1: Canonical Journal Identity Resolution.
    Establishes the 'True' identity of a journal using authoritative local lists (WoS/Scopus).
    """
    
    def __init__(self, data_dir: str = "data/integrity"):
        self.data_dir = data_dir
        self.wos_db = self._load_json("wos_master_list.json")
        self.scopus_db = self._load_json("scopus_list.json")

    def _load_json(self, filename: str) -> List[Dict]:
        try:
            path = os.path.join(self.data_dir, filename)
            if not os.path.exists(path):
                return []
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return []

    def resolve(self, issn: str, title: str) -> Optional[JournalIdentity]:
        """
        Attempt to resolve a journal by ISSN first (Primary), then Title (Secondary).
        Returns canonical identity or None.
        """
        # 1. Normalize Input
        norm_issn = self._normalize_issn(issn)
        norm_title = title.upper().strip()
        
        # 2. Search WoS (Primary Authority)
        match = self._search_db(self.wos_db, norm_issn, norm_title)
        if match:
            return JournalIdentity(
                title=match.get('title'),
                issn=match.get('issn') or norm_issn,
                eissn=match.get('eissn'),
                publisher=match.get('publisher'),
                country=match.get('country', 'Unknown'),
                url=None # Master list usually doesn't have the specific URL, we verify that later
            )

        # 3. Search Scopus (Secondary)
        match = self._search_db(self.scopus_db, norm_issn, norm_title)
        if match:
             return JournalIdentity(
                title=match.get('title'),
                issn=match.get('issn') or norm_issn,
                publisher=match.get('publisher'),
                country='Unknown', # Scopus lightweight list might miss country
                url=None
            )

        return None

    def _normalize_issn(self, issn: str) -> str:
        """Ensure XXXX-XXXX format."""
        clean = issn.replace('-', '').strip()
        if len(clean) == 8:
            return f"{clean[:4]}-{clean[4:]}"
        return issn


    def _search_db(self, db: List[Dict], issn: str, title: str) -> Optional[Dict]:
        # Priority 1: Exact ISSN match
        for entry in db:
            e_issn = entry.get('issn', '')
            e_eissn = entry.get('eissn', '')
            if issn == e_issn or issn == e_eissn:
                return entry
        
        # Priority 2: Exact Title match (fallback)
        for entry in db:
            if entry.get('title', '').upper() == title:
                return entry
                
        return None

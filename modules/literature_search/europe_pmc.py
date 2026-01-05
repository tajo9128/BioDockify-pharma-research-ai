"""
Europe PMC Scraper Module
Provides access to bio-literature text mining and open access full text.
"""

import requests
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class EuropePMCScraper:
    """
    Scraper for Europe PMC RESTful API.
    Docs: https://europepmc.org/RestfulWebService
    """
    
    BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    
    def __init__(self, email: Optional[str] = None):
        self.email = email

    def search_papers(self, query: str, max_results: int = 10) -> List[Dict]:
        """
        Search Europe PMC. 
        """
        # query params usually require specific format
        params = {
            "query": query,
            "format": "json",
            "pageSize": max_results,
            "resultType": "core", # lighter weight, standard metadata
            "synonym": "true" # auto-expand query terms
        }
        
        # CursorMark handling could be added for deep paging, but start simple.
        
        try:
            logger.info(f"Searching Europe PMC for: {query}")
            resp = requests.get(self.BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            
            data = resp.json()
            results = []
            
            result_list = data.get("resultList", {}).get("result", [])
            
            for item in result_list:
                paper = {
                    "title": item.get("title", "No Title"),
                    "abstract": item.get("abstractText", "No abstract available."),
                    "pmid": item.get("pmid", ""),
                    "pmcid": item.get("pmcid", ""),
                    "doi": item.get("doi", ""),
                    "publication_date": item.get("pubYear", "Unknown"),
                    "journal": item.get("journalTitle", "Unknown"),
                    "source": "Europe PMC",
                    "authors": item.get("authorString", "").split(", "),
                    "is_open_access": item.get("isOpenAccess") == "Y",
                    "citation_count": item.get("citedByCount", 0)
                }
                results.append(paper)
                
            return results
            
        except Exception as e:
            logger.error(f"Europe PMC Search Failed: {e}")
            return []

# Helper
def search_europepmc(query: str, max_results: int = 10) -> List[Dict]:
    scraper = EuropePMCScraper()
    return scraper.search_papers(query, max_results)

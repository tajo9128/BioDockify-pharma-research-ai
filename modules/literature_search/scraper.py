"""
PubMed Scraper Module - Zero-Cost Pharma Research AI
Handles fetching of scientific literature using Bio.Entrez (public API) with offline resilience.
"""

import socket
import time
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
import logging

try:
    from Bio import Entrez
except ImportError:
    Entrez = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PubmedScraperConfig:
    """Configuration for the PubMed Scraper."""
    email: str = "researcher@example.com"  # Required by NCBI
    api_key: Optional[str] = None  # Optional: Increases rate limit
    max_results: int = 10
    tool_name: str = "BioDockify"

class PubmedScraper:
    """
    Robust PubMed scraper with offline handling and batch capabilities.
    """
    
    def __init__(self, config: Optional[PubmedScraperConfig] = None):
        """Initialize the scraper with configuration."""
        self.config = config or PubmedScraperConfig()
        
        if Entrez:
            Entrez.email = self.config.email
            Entrez.tool = self.config.tool_name
            if self.config.api_key:
                Entrez.api_key = self.config.api_key
        else:
            logger.warning("Biopython not installed. Scraper will function in OFFLINE mode only.")

    def _is_online(self, host="www.ncbi.nlm.nih.gov", port=443, timeout=3) -> bool:
        """Check for internet connectivity."""
        try:
            socket.create_connection((host, port), timeout=timeout)
            return True
        except OSError:
            return False

    def search_papers(self, query: str, max_results: Optional[int] = None) -> List[Dict]:
        """
        Search PubMed for papers matching the query.
        
        Args:
            query: Search string (e.g., 'Alzheimer kinase inhibitors')
            max_results: Override default max results
            
        Returns:
            List of dictionaries containing paper metadata.
            Returns empty list on error or offline mode.
        """
        limit = max_results or self.config.max_results
        
        # 1. Check Offline Mode
        if not self._is_online():
            logger.warning("OFFLINE MODE DETECTED: Returning empty results for query: %s", query)
            return [{"title": "Network Error: Running in strict offline mode", "pmid": "000000"}]

        if not Entrez:
            logger.error("Biopython missing. Please run: pip install biopython")
            return []

        try:
            # 2. Search for IDs
            logger.info("Searching PubMed for: %s", query)
            handle = Entrez.esearch(db="pubmed", term=query, retmax=limit)
            record = Entrez.read(handle)
            handle.close()
            
            id_list = record.get("IdList", [])
            if not id_list:
                logger.info("No results found.")
                return []

            # 3. Fetch Details
            logger.info("Fetching details for %d papers...", len(id_list))
            handle = Entrez.efetch(db="pubmed", id=",".join(id_list), rettype="medline", retmode="text")
            # Note: For production, we'd use a proper parser. For zero-cost simplicity, we parse text.
            # Or better, let's use xml return for structured data if valid.
            # Using 'xml' is safer with Entrez.read
            handle = Entrez.efetch(db="pubmed", id=",".join(id_list), retmode="xml")
            papers = Entrez.read(handle)
            handle.close()
            
            # 4. Parse Results
            results = []
            for article in papers.get('PubmedArticle', []):
                medline = article.get('MedlineCitation', {})
                article_data = medline.get('Article', {})
                
                # Extract abstract safely
                abstract_list = article_data.get('Abstract', {}).get('AbstractText', [])
                abstract = " ".join(abstract_list) if abstract_list else "No abstract available."
                
                # Extract robust metadata
                paper = {
                    "title": article_data.get('ArticleTitle', 'No title'),
                    "abstract": abstract,
                    "pmid": str(medline.get('PMID', '')),
                    "publication_date": article_data.get('Journal', {}).get('JournalIssue', {}).get('PubDate', {}).get('Year', 'Unknown'),
                    "journal": article_data.get('Journal', {}).get('Title', 'Unknown'),
                    "authors": [a.get('LastName', '') + ' ' + a.get('Initials', '') 
                              for a in article_data.get('AuthorList', [])],
                    "doi": next((id.title() for id in article.get('PubmedData', {}).get('ArticleIdList', []) 
                               if id.attributes.get('IdType') == 'doi'), None)
                }
                results.append(paper)
            
            return results

        except Exception as e:
            logger.error("Error during PubMed search: %s", e)
            return []

    def batch_search(self, queries: List[str]) -> Dict[str, List[Dict]]:
        """
        Perform searches for multiple queries.
        
        Args:
            queries: List of query strings
            
        Returns:
            Dictionary mapping query -> results list
        """
        batch_results = {}
        for q in queries:
            batch_results[q] = self.search_papers(q)
            time.sleep(1) # Respect NCBI rate limits (3 requests/sec or 10 w/ API key)
        return batch_results

# Helper function for easy import
def search_papers(query: str, max_results: int = 10) -> List[Dict]:
    """Simple wrapper for quick usage."""
    scraper = PubmedScraper(PubmedScraperConfig(max_results=max_results))
    return scraper.search_papers(query)

if __name__ == "__main__":
    # Test block
    print("Testing PubMed Scraper...")
    papers = search_papers("Alzheimer kinase inhibitors", max_results=3)
    for p in papers:
        print(f"\nTitle: {p['title']}")
        print(f"PMID: {p['pmid']}")
        print(f"Abstract preview: {p['abstract'][:100]}...")

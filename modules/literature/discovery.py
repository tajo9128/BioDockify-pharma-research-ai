"""
Discovery Engine
Aggregates scientific literature from multiple sources:
1. PubMed (via BioPython)
2. Semantic Scholar (via Graph API)
3. ArXiv (via API)
"""
import asyncio
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime

# Import clients (assuming they are installed)
import arxiv
from Bio import Entrez
from semanticscholar import SemanticScholar

logger = logging.getLogger("literature.discovery")

@dataclass
class Paper:
    """Unified Paper Model"""
    title: str
    url: str
    source: str  # 'pubmed', 'arxiv', 'semantic_scholar'
    authors: List[str]
    abstract: str
    year: int
    doi: Optional[str] = None
    citations: int = 0
    pdf_url: Optional[str] = None

class LiteratureDiscovery:
    def __init__(self):
        # Configure Entrez
        Entrez.email = "agent.zero@biodockify.ai"
        
        # Semantic Scholar Client
        self.sch = SemanticScholar(timeout=10)
        
    async def search(self, query: str, limit: int = 20) -> List[Paper]:
        """Aggregate search across all sources."""
        logger.info(f"Discovery Engine: Searching for '{query}'")
        
        # Run searches in parallel
        results = await asyncio.gather(
            self.search_arxiv(query, limit=limit // 2),
            self.search_semantic_scholar(query, limit=limit // 2),
            # PubMed is synchronous, run in thread if needed, or simple sync mostly fast
            self.search_pubmed(query, limit=limit // 2)
        )
        
        # Flatten and deduplicate
        all_papers = []
        seen_titles = set()
        
        for source_results in results:
            for p in source_results:
                # Basic dedup by title normaliztion
                norm_title = p.title.lower().strip()
                if norm_title not in seen_titles:
                    all_papers.append(p)
                    seen_titles.add(norm_title)
        
        # Sort by relevance/citations/date (heuristic mix)
        # Prioritize recent + high citation
        all_papers.sort(key=lambda x: (x.year, x.citations), reverse=True)
        
        return all_papers[:limit]

    async def search_arxiv(self, query: str, limit: int = 10) -> List[Paper]:
        """Search ArXiv."""
        try:
            search = arxiv.Search(
                query=query,
                max_results=limit,
                sort_by=arxiv.SortCriterion.Relevance
            )
            
            papers = []
            # arxiv client is synchronous iterator
            for result in search.results():
                papers.append(Paper(
                    title=result.title,
                    url=result.entry_id,
                    source="arxiv",
                    authors=[a.name for a in result.authors],
                    abstract=result.summary,
                    year=result.published.year,
                    doi=result.doi,
                    pdf_url=result.pdf_url
                ))
            return papers
        except Exception as e:
            logger.error(f"ArXiv search failed: {e}")
            return []

    async def search_semantic_scholar(self, query: str, limit: int = 10) -> List[Paper]:
        """Search Semantic Scholar."""
        try:
            # Run sync client in executor
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None, 
                lambda: self.sch.search_paper(query, limit=limit)
            )
            
            papers = []
            for item in results:
                papers.append(Paper(
                    title=item.title,
                    url=item.url,
                    source="semantic_scholar",
                    authors=[a.name for a in item.authors] if item.authors else [],
                    abstract=item.abstract or "",
                    year=item.year or datetime.now().year,
                    doi=item.externalIds.get('DOI') if item.externalIds else None,
                    citations=item.citationCount or 0
                ))
            return papers
        except Exception as e:
            logger.error(f"Semantic Scholar search failed: {e}")
            return []

    async def search_pubmed(self, query: str, limit: int = 10) -> List[Paper]:
        """Search PubMed."""
        try:
            loop = asyncio.get_event_loop()
            
            def _pubmed_sync():
                handle = Entrez.esearch(db="pubmed", term=query, retmax=limit)
                record = Entrez.read(handle)
                handle.close()
                
                id_list = record["IdList"]
                if not id_list:
                    return []
                
                handle = Entrez.efetch(db="pubmed", id=id_list, retmode="xml")
                articles = Entrez.read(handle)
                handle.close()
                return articles['PubmedArticle']

            articles = await loop.run_in_executor(None, _pubmed_sync)
            
            papers = []
            for article in articles:
                medline = article['MedlineCitation']
                article_data = medline['Article']
                
                title = article_data.get('ArticleTitle', 'No Title')
                abstract = ""
                if 'Abstract' in article_data:
                    abstract_list = article_data['Abstract']['AbstractText']
                    abstract = " ".join(str(x) for x in abstract_list)
                
                # DOI extraction
                doi = None
                for id_obj in article['PubmedData']['ArticleIdList']:
                    if id_obj.attributes.get('IdType') == 'doi':
                        doi = str(id_obj)
                
                # Authors
                authors = []
                if 'AuthorList' in article_data:
                    for a in article_data['AuthorList']:
                        if 'LastName' in a and 'ForeName' in a:
                            authors.append(f"{a['LastName']} {a['ForeName']}")
                
                # Year
                year = datetime.now().year
                if 'Journal' in article_data and 'JournalIssue' in article_data['Journal'] and 'PubDate' in article_data['Journal']['JournalIssue']:
                    yd = article_data['Journal']['JournalIssue']['PubDate'].get('Year')
                    if yd: year = int(yd)

                papers.append(Paper(
                    title=title,
                    url=f"https://pubmed.ncbi.nlm.nih.gov/{medline['PMID']}/",
                    source="pubmed",
                    authors=authors,
                    abstract=abstract,
                    year=year,
                    doi=doi
                ))
            return papers

        except Exception as e:
            logger.error(f"PubMed search failed: {e}")
            return []

# Singleton instance
discovery_engine = LiteratureDiscovery()

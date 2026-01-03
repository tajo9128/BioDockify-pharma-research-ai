"""
Literature Search Module
------------------------
Provides functionality to search and retrieve scientific papers.
"""

from .scraper import PubmedScraper, PubmedScraperConfig, search_papers

__all__ = ['PubmedScraper', 'PubmedScraperConfig', 'search_papers']

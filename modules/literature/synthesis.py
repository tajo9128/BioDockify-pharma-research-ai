"""
Synthesis Engine
Generates structured literature reviews using RAG-based LLM generation.
"""
import logging
import asyncio
from typing import List, Dict
from dataclasses import asdict

from .discovery import Paper
from modules.rag.vector_store import get_vector_store

logger = logging.getLogger("literature.synthesis")

class ReviewSynthesizer:
    def __init__(self):
        self.vector_store = get_vector_store()

    async def generate_review(self, topic: str, papers: List[Paper]) -> str:
        """
        Synthesize a structured review based on the topic and selected papers.
        Uses the internal RAG store (where deep_research results are indexed).
        """
        logger.info(f"Synthesizing review for '{topic}' from {len(papers)} papers")
        
        # 1. Outline Generation
        sections = ["Introduction", "Methodology Overview", "Key Findings", "Discussion & Gaps", "Conclusion"]
        full_report = f"# Systematic Review: {topic}\n\n"
        
        # 2. Section-by-Section Generation (Iterative RAG)
        for section in sections:
            logger.info(f"Drafting section: {section}")
            content = await self._write_section(topic, section)
            full_report += f"## {section}\n\n{content}\n\n"
            
        # 3. Add References
        full_report += "## References\n\n"
        for i, paper in enumerate(papers, 1):
            full_report += f"{i}. **{paper.title}**. {paper.authors[0] if paper.authors else 'Unknown'} et al. ({paper.year}). {paper.source}.\n"
            if paper.doi:
                full_report += f"   DOI: {paper.doi}\n"
        
        return full_report
    
    async def _write_section(self, topic: str, section: str) -> str:
        """Retrieve context and write a single section."""
        # Query vector store for this specific section/topic combo
        query = f"{topic} {section}"
        results = self.vector_store.search(query, k=5)
        
        context_text = "\n\n".join([r['text'][:1000] for r in results])
        
        # TODO: Replace with real LLM call
        # For now, placeholder to allow orchestration testing
        return f"*(AI Generated content for {section} would appear here, based on {len(results)} retrieved chunks)*\n\n> {context_text[:200]}..."

# Singleton
synthesis_engine = ReviewSynthesizer()

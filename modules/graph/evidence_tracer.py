"""
BioDockify Provenance Module: EvidenceGraph Integration
Extensions for Neo4j to track detailed chain-of-custody for every scientific claim.
Model: (Claim)-[:DERIVED_FROM]->(Sentence)-[:FOUND_IN]->(Paper)
"""

import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)

@dataclass
class ProvenanceNode:
    claim_text: str
    sentence_text: str
    paper_doi: str
    confidence_score: float
    method_used: str # e.g., "BioBERT-NER", "AgentZero-Synthesis"

class EvidenceGraphBuilder:
    """
    Manages the creation of rigorous audit trails in the Neo4j Knowledge Graph.
    Ensures every synthesized fact can be traced back to a specific sentence in a specific paper.
    """
    
    def __init__(self, uri: str = "bolt://localhost:7687", auth: tuple = ("neo4j", "password")):
        try:
            self.driver = GraphDatabase.driver(uri, auth=auth)
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None
            
    def close(self):
        if self.driver:
            self.driver.close()
            
    def add_provenance_chain(self, node: ProvenanceNode):
        """
        Creates the Claim -> Sentence -> Source chain in the graph.
        """
        if not self.driver:
            return
            
        query = """
        MERGE (p:Paper {doi: $doi})
        
        MERGE (s:Sentence {text: $sentence_text})
        MERGE (s)-[:FOUND_IN]->(p)
        
        MERGE (c:Claim {text: $claim_text})
        SET c.confidence = $confidence,
            c.method = $method
            
        MERGE (c)-[:DERIVED_FROM]->(s)
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, 
                            doi=node.paper_doi,
                            sentence_text=node.sentence_text,
                            claim_text=node.claim_text,
                            confidence=node.confidence_score,
                            method=node.method_used)
                logger.info(f"Provenance chain added for claim: {node.claim_text[:30]}...")
        except Exception as e:
            logger.error(f"Failed to add provenance: {e}")

    def verify_audit_trail(self, claim_text: str) -> bool:
        """
        Checks if a claim functions as a 'orphan' node or has proper backing.
        Returns True if a valid evidence trail exists.
        """
        if not self.driver:
            return False
            
        query = """
        MATCH (c:Claim {text: $claim_text})-[:DERIVED_FROM]->(s:Sentence)-[:FOUND_IN]->(p:Paper)
        RETURN count(p) > 0 as has_proof
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, claim_text=claim_text).single()
                return result["has_proof"] if result else False
        except Exception as e:
            logger.error(f"Audit verification failed: {e}")
            return False

"""
Neo4j Graph Builder Module - BioDockify Pharma Research AI
Handles loading research data into a Neo4j Knowledge Graph.
Designed to fail gracefully if the database is offline or package not installed.

NOTE: Neo4j functionality is being replaced by SurfSense Knowledge Engine.
This module is kept for backward compatibility but will be deprecated.
"""

import os
import logging
from typing import Dict, List, Optional, Any

# Make neo4j import optional - SurfSense is the primary knowledge engine now
try:
    from neo4j import GraphDatabase, basic_auth
    from neo4j.exceptions import ServiceUnavailable, AuthError
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    GraphDatabase = None
    basic_auth = None
    ServiceUnavailable = Exception
    AuthError = Exception

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BioDockify.GraphBuilder")

if not NEO4J_AVAILABLE:
    logger.info("Neo4j package not installed. Graph features disabled. Using SurfSense instead.")

class Neo4jLoader:
    """
    Robust wrapper for Neo4j operations.
    """
    
    def __init__(self, uri: str = "bolt://localhost:7687", auth: tuple = ("neo4j", "neo4j")):
        """
        Initialize the loader.
        
        Args:
            uri: Bolt URI (default: bolt://localhost:7687)
            auth: Tuple of (username, password) (default: neo4j/neo4j)
        """
        self.uri = uri
        self.auth = auth
        self.driver = None
        self._connected = False

    def connect(self):
        """Establish connection to the database."""
        if not NEO4J_AVAILABLE:
            logger.debug("Neo4j package not installed. Skipping connection.")
            return
            
        if self._connected:
            return

        try:
            self.driver = GraphDatabase.driver(self.uri, auth=self.auth)
            # Verify connectivity
            self.driver.verify_connectivity()
            self._connected = True
            logger.info(f"Connected to Neo4j at {self.uri}")
        except (ServiceUnavailable, AuthError) as e:
            logger.warning(f"Graph DB unavailable ({e}). Graph features will be disabled.")
            self._connected = False
        except Exception as e:
            logger.error(f"Unexpected error connecting to Neo4j: {e}")
            self._connected = False

    def close(self):
        """Close the database connection."""
        if self.driver:
            self.driver.close()
            self._connected = False

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None):
        """
        Execute a custom Cypher query.
        Safe to call even if offline (returns None).
        """
        if not self._connected:
            self.connect()
            if not self._connected:
                return None

        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return None

    def create_constraints(self):
        """Create uniqueness constraints for the Knowledge Graph schema."""
        if not self._connected:
            self.connect()
            if not self._connected:
                return

        queries = [
            "CREATE CONSTRAINT paper_pmid_unique IF NOT EXISTS FOR (p:Paper) REQUIRE p.pmid IS UNIQUE",
            "CREATE CONSTRAINT compound_name_unique IF NOT EXISTS FOR (c:Compound) REQUIRE c.name IS UNIQUE"
        ]

        logger.info("Ensuring schema constraints...")
        for q in queries:
            self.execute_query(q)

    def add_paper(self, paper_data: Dict[str, Any]):
        """
        Create or update a Paper node.
        
        Args:
            paper_data: Dict containing 'pmid', 'title', 'abstract', etc.
        """
        if not paper_data.get('pmid'):
            logger.warning("Attempted to add paper without PMID.")
            return

        query = """
        MERGE (p:Paper {pmid: $pmid})
        SET p += $props
        RETURN p.pmid as pmid
        """
        
        # separate metadata from props if needed, but simple map is fine for MVP
        self.execute_query(query, {"pmid": paper_data['pmid'], "props": paper_data})
        logger.info(f"Synced Paper node: {paper_data['pmid']}")

    def connect_compound(self, pmid: str, compound_name: str):
        """
        Create a (Paper)-[:MENTIONS]->(Compound) relationship.
        """
        if not pmid or not compound_name:
            return

        query = """
        MATCH (p:Paper {pmid: $pmid})
        MERGE (c:Compound {name: $name})
        MERGE (p)-[r:MENTIONS]->(c)
        """
        
        self.execute_query(query, {"pmid": pmid, "name": compound_name})
        logger.info(f"Linked Paper {pmid} -> Compound {compound_name}")

# Singleton instance
_loader_instance = None

def get_loader() -> Neo4jLoader:
    """Get or create the singleton loader instance."""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = Neo4jLoader()
    return _loader_instance

# Convenience Functions

def create_constraints():
    get_loader().create_constraints()

def add_paper(paper_data: Dict[str, Any]):
    get_loader().add_paper(paper_data)

def connect_compound(pmid: str, compound_name: str):
    get_loader().connect_compound(pmid, compound_name)

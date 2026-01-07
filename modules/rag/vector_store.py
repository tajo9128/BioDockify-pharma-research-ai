
import chromadb
from chromadb.utils import embedding_functions
import os
from pathlib import Path
from typing import List, Dict, Any

# Define persistence path
DB_PATH = Path(os.getenv('APPDATA', '.')) / "BioDockify" / "rag_db"

class VectorStore:
    def __init__(self):
        # Ensure directory exists
        DB_PATH.mkdir(parents=True, exist_ok=True)
        
        # Initialize Client
        self.client = chromadb.PersistentClient(path=str(DB_PATH))
        
        # Default Embedding Function (all-MiniLM-L6-v2 is standard, fast, local)
        self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Get or Create Collection
        self.collection = self.client.get_or_create_collection(
            name="biodockify_knowledge",
            embedding_function=self.ef
        )

    def add_documents(self, documents: List[Dict[str, Any]]):
        """
        Adds parsed documents to the vector store.
        Expects list of dicts with 'text' and 'metadata'.
        """
        if not documents:
            return
            
        ids = []
        texts = []
        metadatas = []
        
        for i, doc in enumerate(documents):
            # Generate deterministic or random ID. 
            # Combining source + index is good for uniqueness per file upload session
            source = doc['metadata'].get('source', 'unknown')
            idx = doc['metadata'].get('cell_index', doc['metadata'].get('page_number', i))
            unique_id = f"{source}_{idx}"
            
            ids.append(unique_id)
            texts.append(doc['text'])
            metadatas.append(doc['metadata'])
            
        self.collection.upsert(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )

    def query(self, query_text: str, n_results: int = 5) -> List[str]:
        """
        Semantic search for relevant context.
        """
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        # Flatten results (results['documents'] is list of list)
        if results['documents']:
            return results['documents'][0]
        return []

    def clear(self):
        """Wipes the database."""
        self.client.delete_collection("biodockify_knowledge")
        self.collection = self.client.get_or_create_collection(
            name="biodockify_knowledge",
            embedding_function=self.ef
        )

vector_store = VectorStore()

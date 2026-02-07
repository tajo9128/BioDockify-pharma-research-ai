"""
Hybrid Memory System - Combines FAISS vector store with NanoBot's file memory.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class MemoryArea(Enum):
    MAIN = "main"
    FRAGMENTS = "fragments"
    SOLUTIONS = "solutions"
    INSTRUMENTS = "instruments"

class HybridMemory:
    """
    Unified memory system:
    1. FAISS Vector DB for semantic search (Agent Zero style)
    2. File-based daily notes (NanoBot style)
    """
    
    def __init__(self, workspace_path: str, memory_subdir: str = "default"):
        self.workspace = Path(workspace_path)
        self.memory_dir = self.workspace / "memory" / memory_subdir
        self.daily_dir = self.workspace / "memory" / "daily"
        
        # Ensure directories exist
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        self.daily_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Vector DB (Mock/Placeholder for now, integration with real FAISS next)
        self.vector_store = None 
        
    async def add_memory(self, content: str, area: MemoryArea = MemoryArea.MAIN):
        """Add memory to both vector store and daily log."""
        # 1. Add to daily log
        self._append_daily(content, area)
        
        # 2. Add to vector store (Placeholder)
        # await self.vector_store.add_texts([content], metadatas=[{"area": area.value}])
        
    def _append_daily(self, content: str, area: MemoryArea):
        """Append to today's markdown file."""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_file = self.daily_dir / f"{today}.md"
        
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"\n### [{timestamp}] {area.value.upper()}\n{content}\n"
        
        mode = "a" if daily_file.exists() else "w"
        with open(daily_file, mode, encoding="utf-8") as f:
            if mode == "w":
                f.write(f"# Daily Memory - {today}\n")
            f.write(entry)
            
    async def search(self, query: str, limit: int = 5) -> List[str]:
        """Search memory (Vector + Recent)."""
        # Placeholder for real vector search
        return []
        
    def get_recent(self, days: int = 3) -> str:
        """Get recent daily logs."""
        from datetime import timedelta
        
        content = []
        today = datetime.now()
        for i in range(days):
            date = today - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            path = self.daily_dir / f"{date_str}.md"
            if path.exists():
                content.append(path.read_text(encoding="utf-8"))
                
        return "\n\n".join(content)

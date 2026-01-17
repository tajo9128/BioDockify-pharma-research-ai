"""
Persistent Task Storage
Provides SQLite-backed task storage for research tasks.
"""

import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from threading import Lock

logger = logging.getLogger("task_store")


class TaskStore:
    """
    Persistent task storage using SQLite.
    Thread-safe with automatic database creation.
    """
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = Path.home() / ".biodockify" / "data" / "tasks.db"
        
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._init_db()
    
    def _init_db(self):
        """Initialize the database schema."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    task_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL DEFAULT 'pending',
                    progress INTEGER DEFAULT 0,
                    title TEXT,
                    mode TEXT,
                    logs TEXT DEFAULT '[]',
                    result TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            conn.commit()
            conn.close()
            logger.info(f"TaskStore initialized at {self.db_path}")
    
    def create_task(self, task_id: str, title: str = "", mode: str = "local") -> Dict[str, Any]:
        """Create a new task."""
        now = datetime.now().isoformat()
        task = {
            "task_id": task_id,
            "status": "pending",
            "progress": 0,
            "title": title,
            "mode": mode,
            "logs": [],
            "result": None,
            "created_at": now,
            "updated_at": now
        }
        
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO tasks (task_id, status, progress, title, mode, logs, result, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id, "pending", 0, title, mode, 
                json.dumps([]), None, now, now
            ))
            
            conn.commit()
            conn.close()
        
        return task
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a task by ID."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return self._row_to_dict(row)
            return None
    
    def update_task(self, task_id: str, **updates) -> bool:
        """Update a task's fields."""
        if not updates:
            return False
        
        # Handle logs specially
        if "logs" in updates and isinstance(updates["logs"], list):
            updates["logs"] = json.dumps(updates["logs"])
        
        if "result" in updates and isinstance(updates["result"], dict):
            updates["result"] = json.dumps(updates["result"])
        
        updates["updated_at"] = datetime.now().isoformat()
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [task_id]
        
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(f"UPDATE tasks SET {set_clause} WHERE task_id = ?", values)
            
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
        
        return success
    
    def append_log(self, task_id: str, log: str) -> bool:
        """Append a log entry to a task."""
        task = self.get_task(task_id)
        if not task:
            return False
        
        logs = task.get("logs", [])
        logs.append(log)
        
        return self.update_task(task_id, logs=logs)
    
    def list_tasks(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all tasks, most recent first."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute(
                "SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", 
                (limit,)
            )
            rows = cursor.fetchall()
            conn.close()
        
        return [self._row_to_dict(row) for row in rows]
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM tasks WHERE task_id = ?", (task_id,))
            
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
        
        return success
    
    def cleanup_old_tasks(self, days: int = 30) -> int:
        """Delete tasks older than specified days."""
        from datetime import timedelta
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        
        with self._lock:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM tasks WHERE created_at < ?", (cutoff,))
            
            conn.commit()
            deleted = cursor.rowcount
            conn.close()
        
        logger.info(f"Cleaned up {deleted} old tasks")
        return deleted
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert a database row to a dictionary."""
        d = dict(row)
        
        # Parse JSON fields
        if d.get("logs"):
            try:
                d["logs"] = json.loads(d["logs"])
            except:
                d["logs"] = []
        else:
            d["logs"] = []
        
        if d.get("result"):
            try:
                d["result"] = json.loads(d["result"])
            except:
                pass
        
        return d


# Global singleton
_task_store: Optional[TaskStore] = None


def get_task_store() -> TaskStore:
    """Get the global TaskStore singleton."""
    global _task_store
    if _task_store is None:
        _task_store = TaskStore()
    return _task_store

import json
import os
import logging
from typing import Dict, Any, Optional

TASK_DIR = "data/tasks"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BioDockify.TaskManager")

class TaskManager:
    """
    Manages persistence of research tasks to disk.
    Ensure Agent Zero is resumable and state is safe.
    """
    
    def __init__(self):
        if not os.path.exists(TASK_DIR):
            os.makedirs(TASK_DIR, exist_ok=True)

    def _get_path(self, task_id: str) -> str:
        return os.path.join(TASK_DIR, f"{task_id}.json")

    def save_task(self, task_id: str, data: Dict[str, Any]):
        """Checkpoint task state to disk."""
        try:
            with open(self._get_path(task_id), "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save task {task_id}: {e}")

    def load_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Load task state from disk."""
        path = self._get_path(task_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load task {task_id}: {e}")
            return None

    def list_tasks(self) -> Dict[str, Dict[str, Any]]:
        """List all persisted tasks."""
        tasks = {}
        if not os.path.exists(TASK_DIR):
            return tasks

        for filename in os.listdir(TASK_DIR):
            if filename.endswith(".json"):
                task_id = filename.replace(".json", "")
                task = self.load_task(task_id)
                if task:
                    tasks[task_id] = task
        return tasks

# Global Instance
task_manager = TaskManager()

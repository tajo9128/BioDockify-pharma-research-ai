
import asyncio
import logging
import sys
import os
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from modules.enhanced_integration.enhanced_system import get_enhanced_system
from modules.project_planner.project_planner import ProjectType
from modules.multi_task.multi_task_scheduler import TaskStatus

async def test_integrated_flow():
    print("Starting Integrated Flow Test...")
    
    # Initialize system
    system = get_enhanced_system(max_parallel_tasks=3)
    await system.initialize("integrated_test_device")
    await system.start()
    
    print("System initialized and started.")
    
    # 1. Create a project
    project_title = "Integrated Research Project"
    result = await system.create_project(
        project_title=project_title,
        project_type=ProjectType.RESEARCH,
        additional_context="Testing full integration"
    )
    
    project_id = result['project_id']
    print(f"Created project: {project_title} (ID: {project_id})")
    
    # 2. Check initial status
    status = await system.get_project_status(project_id)
    print(f"Initial progress: {status['progress']['progress']}%")
    assert status['progress']['progress'] == 0
    
    # 3. Simulate progress update
    first_task_id = status['tasks'][0]['id']
    print(f"Updating progress for task {first_task_id}...")
    await system.update_task_progress(project_id, first_task_id, 50.0)
    
    status = await system.get_project_status(project_id)
    print(f"Progress after 50% update: {status['progress']['progress']}%")
    
    # 4. Simulate task completion
    print(f"Completing task {first_task_id}...")
    await system.update_task_progress(project_id, first_task_id, 100.0)
    
    status = await system.get_project_status(project_id)
    print(f"Progress after completion: {status['progress']['progress']}%")
    assert status['progress']['completed_tasks'] == 1
    
    # 5. Test suspension and restoration
    print("Suspending system...")
    await system.suspend_and_save()
    
    print("Resuming system...")
    await system.resume_and_restore()
    
    # Verify that we can still get status
    status = await system.get_project_status(project_id)
    print(f"Status after resume: {status['project']['status']}")
    assert status['project']['id'] == project_id
    
    # 6. Verify persistence
    print("Checking scheduler persistence...")
    # Scheduler should have saved its state
    persistence_file = Path("./data/scheduler_state.json")
    assert persistence_file.exists()
    
    await system.stop()
    print("\nINTEGRATED FLOW TEST PASSED!")

async def main():
    # Setup logging to be less verbose for the test
    logging.basicConfig(level=logging.ERROR)
    
    try:
        await test_integrated_flow()
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

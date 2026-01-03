#!/usr/bin/env python3
"""
Zero-Cost Pharma Research AI - Project Setup Script
Creates the complete directory structure for the application.
"""

import os
from pathlib import Path


def create_directory_structure():
    """
    Create the complete directory structure for the Zero-Cost Pharma Research AI project.
    Verifies if folders exist before creating them to avoid errors.
    """

    # Define the directory structure
    directories = {
        'installer': None,
        'runtime/secrets': None,
        'brain/models': None,
        'brain/knowledge_graph': None,
        'brain/vectors': None,
        'orchestration/planner': None,
        'orchestration/critic': None,
        'orchestration/policies': None,
        'orchestration/memory': None,
        'modules/literature_search': None,
        'modules/pdf_processor': None,
        'modules/molecular_vision': None,
        'modules/bio_ner': None,
        'modules/graph_builder': None,
        'modules/analyst': None,
        'api/routers': None,
        'ui/src': None,
        'desktop/tauri': None,
        'lab_interface': None,
    }

    # Get the script's directory and use it as the base
    base_path = Path(__file__).parent

    print("=" * 70)
    print("Zero-Cost Pharma Research AI - Project Setup")
    print("=" * 70)
    print(f"\nBase directory: {base_path}")
    print("\nCreating directory structure...\n")

    # Track statistics
    created_count = 0
    existing_count = 0

    # Create each directory
    for dir_path, _ in directories.items():
        full_path = base_path / dir_path

        try:
            if full_path.exists():
                print(f"✓ Already exists: {dir_path}")
                existing_count += 1
            else:
                full_path.mkdir(parents=True, exist_ok=True)
                print(f"+ Created:        {dir_path}")
                created_count += 1
        except Exception as e:
            print(f"✗ Error creating {dir_path}: {e}")

    print("\n" + "-" * 70)
    print(f"Directory creation summary:")
    print(f"  Created:   {created_count}")
    print(f"  Existing:  {existing_count}")
    print("-" * 70)

    return created_count, existing_count


def create_api_files():
    """
    Create the API initialization files including __init__.py and main.py
    with a Hello World FastAPI instance.
    """

    base_path = Path(__file__).parent
    api_path = base_path / 'api'

    print("\nCreating API files...\n")

    # Create __init__.py
    init_path = api_path / '__init__.py'
    try:
        if init_path.exists():
            print(f"✓ Already exists: api/__init__.py")
        else:
            init_path.touch()
            print(f"+ Created:        api/__init__.py")
    except Exception as e:
        print(f"✗ Error creating api/__init__.py: {e}")

    # Create main.py with FastAPI Hello World
    main_content = '''"""
Zero-Cost Pharma Research AI - API Main Entry Point
FastAPI application for serving AI-powered pharmaceutical research capabilities.
"""

from fastapi import FastAPI

# Initialize FastAPI application
app = FastAPI(
    title="Zero-Cost Pharma Research AI",
    description="AI-powered pharmaceutical research platform",
    version="0.1.0"
)


@app.get("/")
async def root():
    """Root endpoint - Hello World"""
    return {
        "message": "Hello World",
        "service": "Zero-Cost Pharma Research AI",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Zero-Cost Pharma Research AI"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

    main_path = api_path / 'main.py'
    try:
        if main_path.exists():
            print(f"✓ Already exists: api/main.py")
        else:
            main_path.write_text(main_content)
            print(f"+ Created:        api/main.py")
    except Exception as e:
        print(f"✗ Error creating api/main.py: {e}")

    print("\n" + "-" * 70)
    print("API files created successfully!")
    print("-" * 70)


def print_project_structure():
    """Print the final project structure for verification."""

    base_path = Path(__file__).parent

    print("\n" + "=" * 70)
    print("Final Project Structure:")
    print("=" * 70)

    def print_tree(directory, prefix="", is_last=True):
        """Recursively print directory tree structure."""
        try:
            entries = sorted([e for e in directory.iterdir() if e.name != '.git'])
            for i, entry in enumerate(entries):
                is_last_entry = i == len(entries) - 1
                connector = "└── " if is_last_entry else "├── "
                print(f"{prefix}{connector}{entry.name}")

                if entry.is_dir():
                    extension = "    " if is_last_entry else "│   "
                    print_tree(entry, prefix + extension, is_last_entry)
        except PermissionError:
            pass

    print_tree(base_path)
    print("=" * 70)


def main():
    """Main execution function."""
    try:
        # Create directory structure
        create_directory_structure()

        # Create API files
        create_api_files()

        # Print final structure
        print_project_structure()

        print("\n✅ Setup completed successfully!")
        print("\nTo run the API server:")
        print("  cd api")
        print("  python main.py")
        print("\nOr visit http://localhost:8000 in your browser")
        print()

    except KeyboardInterrupt:
        print("\n\n⚠ Setup interrupted by user.")
    except Exception as e:
        print(f"\n\n❌ Setup failed with error: {e}")
        raise


if __name__ == "__main__":
    main()

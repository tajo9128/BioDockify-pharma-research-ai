"""
DECIMER Wrapper Module - BioDockify Pharma Research AI
Provides offline Optical Chemical Structure Recognition (OCSR) using DECIMER.
"""

import os
import logging
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BioDockify.Vision")

# Global availability flag
DECIMER_AVAILABLE = False

try:
    # Attempt to import DECIMER
    # Note: In a real environment, this import might take a few seconds due to TensorFlow
    from DECIMER import predict_SMILES
    DECIMER_AVAILABLE = True
except ImportError:
    logger.warning("DECIMER-Image2SMILES library not installed. Vision features will be disabled.")
except Exception as e:
    logger.error(f"Error initializing DECIMER: {e}")

def is_decimer_available() -> bool:
    """Check if the DECIMER engine is loaded and ready."""
    return DECIMER_AVAILABLE

def extract_smiles_from_image(image_path: str) -> str:
    """
    Extract SMILES string from a chemical structure image.
    
    Args:
        image_path (str): Absolute path to the image file (png, jpg, etc.)
        
    Returns:
        str: Predicted SMILES string, or error code (e.g., "[DECIMER_NOT_AVAILABLE]")
    """
    if not DECIMER_AVAILABLE:
        return "[DECIMER_NOT_AVAILABLE]"
    
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return "[FILE_NOT_FOUND]"

    try:
        logger.info(f"Running DECIMER inference on: {image_path}")
        # Run inference (CPU-compatible by default if TF is CPU-only)
        smiles = predict_SMILES(image_path)
        return smiles
    except Exception as e:
        logger.error(f"Inference failed for {image_path}: {e}")
        return "[INFERENCE_ERROR]"

def batch_extract_smiles(image_paths: List[str]) -> Dict[str, str]:
    """
    Process a batch of images sequentially.
    
    Args:
        image_paths (list): List of file paths.
        
    Returns:
        dict: Mapping of {filepath: results}
    """
    results = {}
    total = len(image_paths)
    
    for idx, path in enumerate(image_paths):
        logger.info(f"Processing image {idx + 1}/{total}...")
        results[path] = extract_smiles_from_image(path)
        
    return results

if __name__ == "__main__":
    # Simple CLI Test
    import sys
    
    print(f"DECIMER Status: {'ONLINE' if DECIMER_AVAILABLE else 'OFFLINE/MISSING'}")
    
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        print(f"Testing on: {target_file}")
        print(f"Result: {extract_smiles_from_image(target_file)}")

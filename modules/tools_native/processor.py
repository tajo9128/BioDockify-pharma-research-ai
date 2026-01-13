
import io
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

# Try imports, handle missing deps gracefully (though they should be in env)
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pandas as pd
except ImportError:
    pd = None

logger = logging.getLogger(__name__)

class ToolProcessor:
    """
    Native implementation of Omni-Tools utilities.
    """

    @staticmethod
    def merge_pdfs(file_contents: List[bytes]) -> bytes:
        if not pypdf:
            raise ImportError("pypdf is required for PDF operations")
        
        merger = pypdf.PdfWriter()
        for content in file_contents:
            pdf_file = io.BytesIO(content)
            merger.append(pdf_file)
            
        output = io.BytesIO()
        merger.write(output)
        return output.getvalue()

    @staticmethod
    def convert_image(content: bytes, target_format: str) -> bytes:
        if not Image:
            raise ImportError("Pillow is required for image operations")
            
        # Supported: PNG, JPEG, WEBP, BMP
        fmt = target_format.upper()
        if fmt == "JPG": fmt = "JPEG"
        
        try:
            with Image.open(io.BytesIO(content)) as img:
                # Convert to RGB if saving as JPEG (handle transparency)
                if fmt == "JPEG" and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                output = io.BytesIO()
                img.save(output, format=fmt)
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Image conversion failed: {e}")

    @staticmethod
    def process_data(content: bytes, filename: str, operation: str) -> Any:
        if not pd:
             raise ImportError("pandas is required for data operations")
             
        # Detect format
        file_ext = Path(filename).suffix.lower()
        
        try:
            df = None
            if file_ext == '.csv':
                df = pd.read_csv(io.BytesIO(content))
            elif file_ext in ['.xls', '.xlsx']:
                df = pd.read_excel(io.BytesIO(content))
            elif file_ext == '.json':
                df = pd.read_json(io.BytesIO(content))
            else:
                raise ValueError("Unsupported input format")
                
            if operation == "to_json":
                return df.to_json(orient="records")
            elif operation == "to_csv":
                return df.to_csv(index=False)
            elif operation == "profile":
                return df.describe().to_json()
                
            raise ValueError(f"Unknown operation: {operation}")
            
        except Exception as e:
            raise ValueError(f"Data processing failed: {e}")

# Singleton
tool_processor = ToolProcessor()

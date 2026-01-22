
import io
import json
import logging
import re
from typing import List, Dict, Any, Optional
from pathlib import Path

# Try imports, handle missing deps gracefully
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
    Expanded to match omni-tools feature set.
    """

    # ========== PDF Tools ==========
    @staticmethod
    def merge_pdfs(file_contents: List[bytes]) -> bytes:
        """Merge multiple PDFs into one."""
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
    def split_pdf(content: bytes, page_ranges: Optional[str] = None) -> List[bytes]:
        """
        Split PDF into separate files.
        page_ranges: e.g., "1-3,5,7-9" or None for all pages individually
        """
        if not pypdf:
            raise ImportError("pypdf is required for PDF operations")
        
        reader = pypdf.PdfReader(io.BytesIO(content))
        total_pages = len(reader.pages)
        
        # Parse page ranges or default to individual pages
        if page_ranges:
            ranges = []
            for part in page_ranges.split(','):
                if '-' in part:
                    start, end = map(int, part.split('-'))
                    ranges.append((start-1, end))  # Convert to 0-indexed
                else:
                    page = int(part)
                    ranges.append((page-1, page))
        else:
            ranges = [(i, i+1) for i in range(total_pages)]
        
        # Create separate PDFs
        results = []
        for start, end in ranges:
            writer = pypdf.PdfWriter()
            for i in range(start, min(end, total_pages)):
                writer.add_page(reader.pages[i])
            
            output = io.BytesIO()
            writer.write(output)
            results.append(output.getvalue())
        
        return results

    # ========== Image Tools ==========
    @staticmethod
    def convert_image(content: bytes, target_format: str) -> bytes:
        """Convert image to target format."""
        if not Image:
            raise ImportError("Pillow is required for image operations")
            
        fmt = target_format.upper()
        if fmt == "JPG": fmt = "JPEG"
        
        try:
            with Image.open(io.BytesIO(content)) as img:
                if fmt == "JPEG" and img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                output = io.BytesIO()
                img.save(output, format=fmt)
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Image conversion failed: {e}")

    @staticmethod
    def resize_image(content: bytes, width: int, height: int, maintain_aspect: bool = True) -> bytes:
        """Resize image to specified dimensions."""
        if not Image:
            raise ImportError("Pillow is required for image operations")
        
        try:
            with Image.open(io.BytesIO(content)) as img:
                if maintain_aspect:
                    img.thumbnail((width, height), Image.Resampling.LANCZOS)
                else:
                    img = img.resize((width, height), Image.Resampling.LANCZOS)
                
                output = io.BytesIO()
                img.save(output, format=img.format or 'PNG')
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Image resize failed: {e}")

    @staticmethod
    def compress_image(content: bytes, quality: int = 85) -> bytes:
        """Compress image with specified quality (1-100)."""
        if not Image:
            raise ImportError("Pillow is required for image operations")
        
        try:
            with Image.open(io.BytesIO(content)) as img:
                output = io.BytesIO()
                
                # Convert to RGB if needed for JPEG
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                img.save(output, format='JPEG', quality=quality, optimize=True)
                return output.getvalue()
        except Exception as e:
            raise ValueError(f"Image compression failed: {e}")

    # ========== Data Tools ==========
    @staticmethod
    def process_data(content: bytes, filename: str, operation: str) -> Any:
        """Process data files (CSV/JSON/Excel)."""
        if not pd:
             raise ImportError("pandas is required for data operations")
             
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
            elif operation == "to_excel":
                output = io.BytesIO()
                df.to_excel(output, index=False)
                return output.getvalue()
            elif operation == "profile":
                return df.describe().to_json()
                
            raise ValueError(f"Unknown operation: {operation}")
            
        except Exception as e:
            raise ValueError(f"Data processing failed: {e}")

    # ========== Text Tools ==========
    @staticmethod
    def transform_text(text: str, operation: str) -> str:
        """
        Transform text with various operations.
        Operations: uppercase, lowercase, titlecase, reverse, shuffle_words
        """
        if operation == "uppercase":
            return text.upper()
        elif operation == "lowercase":
            return text.lower()
        elif operation == "titlecase":
            return text.title()
        elif operation == "reverse":
            return text[::-1]
        elif operation == "shuffle_words":
            import random
            words = text.split()
            random.shuffle(words)
            return ' '.join(words)
        elif operation == "count_words":
            return str(len(text.split()))
        elif operation == "count_chars":
            return str(len(text))
        else:
            raise ValueError(f"Unknown text operation: {operation}")

    # ========== Math Tools ==========
    @staticmethod
    def calculate(expression: str) -> Dict[str, Any]:
        """
        Safely evaluate mathematical expressions.
        Returns result or error.
        """
        try:
            # Sanitize: only allow numbers, operators, and basic math functions
            allowed = set('0123456789+-*/()., ')
            if not all(c in allowed for c in expression.replace('**', '').replace('//', '')):
                raise ValueError("Invalid characters in expression")
            
            # Safe eval (limited scope)
            result = eval(expression, {"__builtins__": {}}, {})
            return {"result": result, "expression": expression}
        except Exception as e:
            return {"error": str(e), "expression": expression}

    @staticmethod
    def generate_primes(limit: int) -> List[int]:
        """Generate prime numbers up to limit (max 10000)."""
        if limit > 10000:
            limit = 10000
        
        if limit < 2:
            return []
        
        # Sieve of Eratosthenes
        sieve = [True] * (limit + 1)
        sieve[0] = sieve[1] = False
        
        for i in range(2, int(limit**0.5) + 1):
            if sieve[i]:
                for j in range(i*i, limit + 1, i):
                    sieve[j] = False
        
        return [i for i in range(limit + 1) if sieve[i]]

# Singleton
tool_processor = ToolProcessor()

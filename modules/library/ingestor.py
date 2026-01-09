import os
import nbformat
import pypdf
import logging
from typing import List, Dict, Any
from pathlib import Path

logger = logging.getLogger("biodockify_library")

class LibraryIngestor:
    """
    Enhanced ingestor for the Digital Library.
    Supports PDF, TXT, MD, IPYNB, and stubs for DOCX.
    """
    
    def process_file(self, file_path: Path) -> Dict[str, Any]:
        """
        Main entry point. Returns { text: str, meta: dict, chunks: list }.
        """
        if not file_path.exists():
             raise FileNotFoundError(f"File not found: {file_path}")
             
        ext = file_path.suffix.lower()
        content = ""
        chunks = []
        
        try:
            if ext == ".pdf":
                content, chunks = self._parse_pdf(file_path)
            elif ext == ".ipynb":
                content, chunks = self._parse_notebook(file_path)
            elif ext in [".md", ".txt"]:
                 content, chunks = self._parse_text(file_path)
            elif ext == ".docx":
                 content, chunks = self._parse_docx_stub(file_path) # Future extension
            else:
                # Fallback binary/unsupported
                return {"text": "", "meta": {"error": "Unsupported format"}, "chunks": []}
                
            return {
                "text": content,
                "chunks": chunks,
                "meta": {
                    "source": file_path.name,
                    "type": ext,
                    "processed": True
                }
            }
        except Exception as e:
            logger.error(f"Ingestion failed for {file_path}: {e}")
            raise e

    def _parse_pdf(self, path: Path):
        text_content = []
        chunks = []
        reader = pypdf.PdfReader(str(path))
        
        if reader.is_encrypted:
             raise ValueError("Encrypted PDF")
             
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_content.append(page_text)
                chunks.append({
                    "text": page_text,
                    "metadata": {"page": i+1}
                })
                
        return "\n\n".join(text_content), chunks

    def _parse_notebook(self, path: Path):
        chunks = []
        full_text = []
        with open(path, "r", encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)
            
        for i, cell in enumerate(nb.cells):
            if cell.cell_type in ["markdown", "code"]:
                source = cell.source
                full_text.append(source)
                chunks.append({
                    "text": source,
                    "metadata": {"cell_type": cell.cell_type, "cell_index": i}
                })
        return "\n".join(full_text), chunks

    def _parse_text(self, path: Path):
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        return text, [{"text": text, "metadata": {"type": "full_text"}}]

    def _parse_docx_stub(self, path: Path):
        # Placeholder for python-docx implementation
        return "[DOCX Parsing not yet enabled]", []

library_ingestor = LibraryIngestor()

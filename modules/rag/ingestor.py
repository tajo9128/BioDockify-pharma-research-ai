
import os
import nbformat
import pypdf
from typing import List, Dict, Any
from pathlib import Path

class DocumentIngestor:
    """
    Handles parsing of various file formats for the RAG system.
    Supports: .ipynb (Jupyter Notebooks), .pdf, .txt, .md
    """
    
    def ingest_file(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Ingests a file and returns a list of text chunks with metadata.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        ext = path.suffix.lower()
        
        if ext == ".ipynb":
            return self._parse_notebook(path)
        elif ext == ".pdf":
            return self._parse_pdf(path)
        elif ext in [".md", ".txt"]:
            return self._parse_text(path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def _parse_notebook(self, path: Path) -> List[Dict[str, Any]]:
        """Parses Jupyter Notebooks into cell-based chunks."""
        chunks = []
        with open(path, "r", encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)
            
        for i, cell in enumerate(nb.cells):
            content = ""
            meta_type = cell.cell_type
            
            if cell.cell_type == "markdown":
                content = f"[MARKDOWN CELL {i+1}]\n{cell.source}"
            elif cell.cell_type == "code":
                content = f"[CODE CELL {i+1}]\n{cell.source}"
                # Optional: Include output if significant?
                # For now, let's keep source code as primary.
            
            if content.strip():
                chunks.append({
                    "text": content,
                    "metadata": {
                        "source": path.name,
                        "type": "notebook_cell",
                        "cell_index": i,
                        "cell_type": meta_type
                    }
                })
        return chunks

    def _parse_pdf(self, path: Path) -> List[Dict[str, Any]]:
        """Parses PDFs into page-based chunks."""
        chunks = []
        reader = pypdf.PdfReader(str(path))
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                chunks.append({
                    "text": text,
                    "metadata": {
                        "source": path.name,
                        "type": "pdf_page",
                        "page_number": i + 1
                    }
                })
        return chunks

    def _parse_text(self, path: Path) -> List[Dict[str, Any]]:
        """Parses text/markdown files."""
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
            
        # Simple recursive splitting could go here, but for MVP keep whole or split by paragraph
        # Let's do simple naive paragraph splitting for now if it's huge
        
        return [{
            "text": text,
            "metadata": {
                "source": path.name,
                "type": "text_file"
            }
        }]

ingestor = DocumentIngestor()

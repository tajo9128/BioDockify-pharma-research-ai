# Scientific Methodology

**BioDockify** employs a multi-stage, agentic workflow to synthesize pharmaceutical knowledge. This document outlines the scientific principles, algorithms, and models underpinning the software.

## 1. Agentic Cognitive Architecture
Unlike traditional script-based tools, BioDockify uses an **Agentic Cognitive Architecture** centered around "Agent Zero".
*   **Reasoning Loop:** The agent operates on a ReAct (Reason+Act) loop. Given a high-level goal (e.g., "Analyze target X"), it decomposes the problem into:
    1.  *Information Retrieval* (Literature Search)
    2.  *Entity Extraction* (BioNER)
    3.  *Structural Analysis* (Knowledge Graph)
    4.  *Synthesis* (Report Generation)
*   **Tool Usage:** The agent is equipped with discrete tools (Python functions) for database access, file parsing, and API calls, ensuring deterministic execution of critical steps.

## 2. Literature Mining & BioNER
The core data ingestion pipeline processes unstructured text (PDFs, Abstracts).
*   **Model:** We utilize a fine-tuned **BioBERT** (Bidirectional Encoder Representations from Transformers for Biomedical Text Mining) model.
*   **Entity Classes:** The model is trained to recognize 5 key entity types with an F1-score > 0.85:
    *   `GENE/PROTEIN`
    *   `CHEMICAL`
    *   `DISEASE`
    *   `SPECIES`
    *   `CELL_LINE`
*   **Normalization:** Extracted entities are normalized to standard ontologies (e.g., UMLS, ChEMBL) to resolve synonyms (e.g., "Tylenol" -> "Acetaminophen").

## 3. Knowledge Graph Construction (GraphRAG)
Extracted data is not merely stored but structured into a **Knowledge Graph (Neo4j)**.
*   **Graph Schema:**
    *   **Nodes:** Represent Entities (e.g., `(Drug: Aspirin)`, `(Target: COX-2)`)
    *   **Edges:** Represent Relationships derived from sentence dependencies (e.g., `[INHIBITS]`, `[UPREGULATES]`, `[ASSOCIATED_WITH]`).
*   **Retrieval Augmented Generation (RAG):** When answer prompts, the system performs a **Graph Traversal** (up to 2 hops) to retrieve context. This "grounds" the Large Language Model (LLM), significantly reducing hallucinations compared to vector-only RAG.

## 4. Chemical Structure Recognition (OCSR)
To bridge the gap between text and chemistry, BioDockify integrates **DECIMER** (Deep Learning for Chemical Image Recognition).
*   **Workflow:**
    1.  PDF segmentation identifies figures containing chemical structures.
    2.  DECIMER (Encoder-Decoder Transformer) converts the image pixel data into a SMILES string.
    3.  The SMILES string is validated using RDKit and added to the Knowledge Graph as a property of the Chemical node.

## 5. Hypothesis Generation
The final synthesis layer uses the structured graph data to generate hypotheses.
*   **Link Prediction:** The system identifies "missing links" in the graph—chemicals and targets that share neighbors but lack a direct edge—suggesting potential repurposing candidates.

# BioDockify AI v2.6.8 🧬

**The Integrated AI Research Platform for Pharmaceutical Intelligence.**

BioDockify AI is a specialized, autonomous ecosystem designed to manage the entire drug discovery lifecycle—from "Blue Sky" hypothesis generation to regulatory submission. It delivers **Pharma-Grade Intelligence** by combining deep reasoning, robotic automation, and advanced biostatistics into a unified, privacy-first workstation.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.6.8-green.svg)](https://github.com/tajo9128/BioDockify-pharma-research-ai)
[![Docker](https://img.shields.io/badge/docker-tajo9128%2Fbiodockify--ai-blue.svg)](https://hub.docker.com/r/tajo9128/biodockify-ai)
[![Privacy](https://img.shields.io/badge/privacy-Local--First-green.svg)]()

---

## 🏗️ The Unified Cognitive Architecture

BioDockify AI is not just a chatbot; it is a **40-Pillar Intelligence System** orchestrated by a central Cognitive Router that adapts to your research role:

### 1. **BioDockify AI (The Research Engine)**
The core reasoning brain. It handles complex, multi-step scientific workflows, moving autonomously from hypothesis to validation. It dynamically switches between **5 Specialized Personas**:
*   **Discovery Scientist**: Target ID, Chemical Space Exploration, and Novelty Assessment.
*   **Pharma Faculty**: Grant writing, lab supervision, and strategic research planning.
*   **PhD Researcher**: Thesis architecture, defense preparation, and deep literature synthesis.
*   **Industrial Scientist**: Regulatory compliance (GxP), pipeline management, and CMC.
*   **Biostatistician**: Clinical trial design, survival analysis, and HEOR modeling.

### 2. **BioDockify AI Lite (The Coordinator)**
The strategic supervisor and interface layer. It manages user interaction, coordinates lightweight tasks, and ensures the Research Engine stays on track. It handles:
*   **Task Delegation**: Breaking down high-level goals for the heavy engine.
*   **Tool Execution**: Managing local integrations (e.g., Python scripts, file I/O).
*   **Lab Automation**: Directing SiLA 2 compliant liquid-handling robots.

### 3. **BioDockify Knowledge Engine**
The deep memory and retrieval layer. It autonomously crawls, reads, and indexes scientific literature to build a comprehensive knowledge graph.
*   **Graph Intelligence**: Maps drug-disease-gene relationships via Neo4j.
*   **Citation Integrity**: Verifies every claim against real-world evidence (PubMed/Crossref).
*   **PDF Parsing**: Extracts structured data from raw papers using GROBID.

---

## 🌟 The 40-Pillar Intelligence Framework

BioDockify AI covers the entire spectrum of pharmaceutical research:

### 🔬 **Discovery & Innovation (Pillars 22-29)**
*   **Target Discovery**: Hidden gene-disease association extraction.
*   **Chemical Space**: Image-to-SMILES conversion for structure digitization.
*   **Hypothesis Generation**: "Blue Sky" connection of disparate scientific concepts.
*   **Network Pharmacology**: Systems-level pathway modeling.

### 📈 **Biostatistics & Clinical (Pillars 30-40)**
*   **Trial Design**: Power calculation and sample size estimation (`power.py`).
*   **Survival Analysis**: Kaplan-Meier curves and Cox Proportional Hazards (`lifelines`).
*   **Safety Signals**: Automated Odds Ratio calculation and Forest Plots for Adverse Events.
*   **HEOR**: Incremental Cost-Effectiveness Ratio (ICER) modeling.

### 🎓 **Academic & Publication (Pillars 11-15)**
*   **Thesis Factory**: Templates for Pharmacology, Pharmaceutics, and Pharm.D.
*   **Systematic Review**: Automated screening and scoring for SLRs (LatteReview).
*   **Forensic Editing**: Authorship analysis and plagiarism detection (Deep Drive).

### 🏭 **Industrial & Regulatory (Pillars 16-21)**
*   **GxP Compliance**: Audit-ready report generation (`python-docx`).
*   **CMC Intelligence**: Manufacturing protocol generation.
*   **Regulatory Guardrails**: Hyperbole detection and claim verification.

---

## 🚀 Quick Start (Docker - v2.6.8)

> **One-Click Installation** - Deploys the entire ecosystem locally.

### 🐳 Via Docker Desktop (Recommended)

1. **Open Docker Desktop**
2. **Search** `tajo9128/biodockify-ai`
3. Click **Pull** -> **Run** (Map port `3000:3000`)
4. **Open** [http://localhost:3000](http://localhost:3000)

### 💻 Via Command Line

**Windows:**
```powershell
.\run.bat
```

**Linux / Mac:**
```bash
chmod +x run.sh
./run.sh
```

---

## 🛠️ Tech Stack & Requirements

| Component | Technology |
| :--- | :--- |
| **Core AI** | Python 3.11, LangChain, LiteLLM |
| **Frontend** | Next.js, React, Tailwind CSS |
| **Bio & Chem** | RDKit, Biopython, OmniPath |
| **Stats** | NumPy, SciPy, Lifelines, Statsmodels |
| **Graph/Vector DB** | ChromaDB (Vector), Postgres (Relational) |
| **Local LLM** | Compatible with Ollama, LM Studio, LocalAI |

**Minimum Requirements**:
*   **RAM**: 8GB (16GB Recommended for local LLM)
*   **Disk**: 20GB (for Docker image + knowledge graph)
*   **Docker Desktop**: v4.0+

---

<p align="center">
  <b>BioDockify AI</b> - Future-Proofing Pharmaceutical Discovery 🧬
</p>

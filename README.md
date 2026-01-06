# BioDockify: Agentic AI for Pharmaceutical Knowledge Discovery

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/tajo9128/BioDockify-pharma-research-ai)](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)]()
[![Status](https://img.shields.io/badge/status-Active_Research-green.svg)]()

**BioDockify** is a local-first, privacy-preserving desktop application designed for pharmaceutical researchers, PhD students, and computational biologists. It leverages Agentic AI, Named Entity Recognition (BioNER), and Knowledge Graphs to automate the extraction and synthesis of complex relationships from biomedical literature.

## 👥 Team & Contact

- **Author:** Tajuddin Shaik  
- **Team:** BioDockify Research Lab  
- **Contact:** biodockify@hotmail.com  
- **Version:** v2.2.0

---

## 🚀 Key Features

*   **Automated Literature Mining:** Parses PDFs using a hybrid Deep Learning approach (BioBERT) to extract Genes, Proteins, and Chemical Compounds.
*   **Agentic Orchestration:** "Agent Zero" autonomously breaks down complex research queries (e.g., "Find inhibitors for Alzheimer's targets") into executable sub-tasks.
*   **Knowledge Graph Construction:** Dynamically builds a Neo4j graph to visualize hidden connections between entities.
*   **Privacy by Design:** Runs **100% locally** on your PC. No data is sent to the cloud for inference, protecting sensitive IP.
*   **Chemical Structure Recognition:** Integrates DECIMER to convert chemical images in papers into machine-readable SMILES strings.

## 🎯 Target Audience

*   **Academic Researchers:** Accelerate literature reviews and hypothesis generation.
*   **Pharmaceutical Scientists:** Identify novel drug repurposing candidates.
*   **Bioinformatics Students:** Learn agentic workflows and graph database interactions.

---

## 📥 Installation

**BioDockify** is available as a professional Windows installer.

1.  **Download:** Go to the [Releases Page](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases) and download `BioDockify_Professional_Setup_v2.0.exe`.
2.  **Install:** Run the installer. It will guide you through the setup.
3.  **Docker:** BioDockify requires **Docker Desktop** for the local AI engine. The installer will check for this.

For detailed instructions, see [INSTALLATION.md](INSTALLATION.md).

---

## ⚡ Quick Start

1.  Launch **BioDockify AI** from your Desktop.
2.  Navigate to the **Research** tab.
3.  Enter a query: *"Identify plant-based compounds related to BACE1 inhibition."*
4.  The Agent will:
    *   Search mapped literature.
    *   Extract entities.
    *   Construct a graph.
    *   Generate a summary report.

For a full walkthrough, consult the [USER_GUIDE.md](USER_GUIDE.md).

---

## 🏗 Architecture

BioDockify uses a modular architecture:
*   **Frontend:** React.js (modern UI)
*   **Desktop Shell:** Tauri (Rust-based, secure & lightweight)
*   **Backend:** FastAPI (Python)
*   **AI Engine:** Local TensorFlow & PyTorch models encapsulated in Docker

See [ARCHITECTURE.md](ARCHITECTURE.md) for deeper technical details.

---

## ⚠️ Disclaimer

> **For Research Use Only.**
> This software is intended for academic and research purposes. It does not provide medical, clinical, or regulatory advice. AI models can hallucinate; always verify findings with primary literature.
> See [DISCLAIMER.md](DISCLAIMER.md) for full legal text.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

## 🖊 Citation

If you use BioDockify in your research, please cite it:

```bibtex
@software{BioDockify2026,
  author = {Your Name / Team},
  title = {BioDockify: Agentic AI for Pharmaceutical Knowledge Discovery},
  year = {2026},
  version = {2.0.39},
  url = {https://github.com/tajo9128/BioDockify-pharma-research-ai}
}
```
See [CITATION.cff](CITATION.cff) for more formats.

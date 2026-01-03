# BioDockify: Zero-Cost Pharma Research AI 🧬💊

> **Democratizing Drug Discovery with Offline-First AI**

BioDockify is a comprehensive, open-source **Pharmaceutical Research Intelligence Platform**. It runs completely offline on standard desktop hardware (no expensive GPUs or cloud subscriptions required), yet provides "Hybrid Mode" to seamlessly integrate with premium Cloud APIs (OpenAI, Elsevier) if available.

![BioDockify](https://img.shields.io/badge/Status-Production_Ready-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Offline](https://img.shields.io/badge/AI-Offline_First-orange)

---

## 🚀 Key Features

*   **🧠 Zero-Cost AI Core**: Powered by **Ollama** (Llama2/Qwen) and **BioNER** (SciSpacy) for free, unlimited local inference.
*   **🕸️ Knowledge Graph**: Automatically builds a local Neo4j graph of Drugs, Targets, and Diseases from literature.
*   **🧪 Lab Automation**: Generates **SiLA 2.0** XML protocols for liquid handlers (Tecan/Hamilton) directly from research findings.
*   **📑 Automated Reporting**: Produces professional **DOCX** research reports with one click.
*   **⚡ Hybrid Cloud Architecture**:
    *   *Default*: 100% Offline (Privacy-focused).
    *   *Enhanced*: Auto-switches to **OpenAI GPT-4** or **Elsevier APIs** if you provide keys.
*   **🖥️ Desktop Experience**: Bundled as a native Windows application via **Tauri**.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, TailwindCSS
*   **Desktop Shell**: Tauri (Rust)
*   **Backend**: Python (FastAPI)
*   **Database**: Neo4j (Graph), FAISS (Vector)
*   **AI Models**: Ollama (LLM), SciSpacy (NER), DECIMER (Vision)

---

## 📦 Installation

### Option 1: The Installer (Windows)
1.  Download the latest release (`BioDockify_Setup.exe`).
2.  Run the installer.
3.  Launch **BioDockify** from your Start Menu.
4.  *(Optional)* Configure API keys in `runtime/config.yaml`.

### Option 2: Build from Source

**Prerequisites**:
*   Python 3.10+
*   Node.js 18+
*   Rus (for Tauri)
*   Neo4j Desktop (or Docker)

**Build Steps**:
```bash
# 1. Clone Repo
git clone https://github.com/your-username/BioDockify.git
cd BioDockify

# 2. Setup Backend
pip install -r requirements.txt

# 3. Setup Frontend
cd desktop/tauri
npm install

# 4. Run Development Mode
# Terminal A (Backend)
..\..\runtime\start_backend.bat

# Terminal B (Frontend)
npm run tauri dev
```

---

## 💡 Usage Guide

1.  **Launch App**: Open BioDockify.
2.  **Start Research**: Enter a target (e.g., *"Novel inhibitors for Alzheimer's targets"*).
3.  **Monitor Plan**: Watch the Orchestrator break down the task (Search -> Extract -> Analyze).
4.  **View Results**:
    *   **Graph**: Interactively explore connections.
    *   **Reports**: Find generated reports in `lab_interface/reports/`.
    *   **Protocols**: Find robot instructions in `lab_interface/sila_protocols/`.

---

## 🤝 Contributing
Contributions are welcome! Please check `CONTRIBUTING.md` for guidelines.

## 📄 License
MIT License. Free for academic and commercial use.

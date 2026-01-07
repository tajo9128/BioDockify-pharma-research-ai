# BioDockify v2.0.0 🧬

**The "Always-On" Autonomous Pharmaceutical Research Agent**

BioDockify is a local-first, privacy-preserving AI workstation designed for pharmaceutical researchers, PhD students, and drug discovery scientists. It transforms standard LLVs (Large Language Models) into "Pharma-Grade" research assistants capable of deep literature review, hypothesis generation, and academic synthesis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.8.0-green.svg)
![Status](https://img.shields.io/badge/status-Production-teal.svg)

## 🚀 Key Features (v2.5.0)

### 🧠 The Intelligence Layer ("The Brain")
*   **Multi-Model Engine**: Seamlessly route queries between **GLM-4.7**, **Google Gemini**, **Hugging Face**, **OpenRouter**, or local **Ollama** models.
*   **Pharma-Grade Compliance**: Integrated access to **PubMed**, **PubTator** (NER), **Semantic Scholar** (Impact Ranking), and **Unpaywall** (Legal OA).
*   **Reasoning Modes**:
    *   `Search`: Pure evidence retrieval.
    *   `Synthesize`: Connecting dots and finding patterns.
    *   `Write`: Academic drafting with strict **Citation Locks**.

### 🛡️ The Safety Layer
*   **Citation Lock**: The agent refuses to generate scientific claims without cited evidence (Low/Medium/High strictness).
*   **Conflict Detection**: Actively scans for and highlights contradictory evidence in literature.
*   **Context Awareness**: "Perplexity-Like" intent classification steers the research strategy.

### ⚡ The System Layer ("The Body")
*   **Always-On**: Minimizes to System Tray for background monitoring.
*   **Hardware Aware**: Auto-pauses heavy inference when on battery power.
*   **Local-First**: All research data, plans, and API keys are stored locally in `user_config`.

## 🛠️ Installation

### Prerequisites
*   **Python 3.10+** (Backend)
*   **Node.js 18+** (Frontend)
*   **Rust** (Desktop Shell)
*   **Ollama** (Optional, for local inference)

### Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-org/biodockify.git
    cd biodockify
    ```

2.  **Install Backend Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ui
    npm install
    ```

4.  **Run the Application**
    ```bash
    # From root directory
    npm run tauri dev
    ```

## ⚙️ Configuration

BioDockify v2.0.0 introduces a comprehensive **Settings Panel** (Gear Icon):

*   **Cloud Keys**: Enter your GLM-4.7, Google, or OpenRouter keys (stored locally).
*   **Persona**: Set your role (`PhD Student`, `Industry Scientist`) to adjust agent strictness.
*   **Literature**: Toggle specific sources (`PubMed`, `bioRxiv`, `ClinicalTrials.gov`).
*   **Output**: Configure export formats (`PDF`, `LaTeX`, `Markdown`) and citation styles.

## 🏗️ Architecture

*   **Frontend**: Next.js 15 + React 19 + Tailwind CSS (Cyberpunk/Lab Aesthetics)
*   **Orchestrator**: Python FastAPI + LangChain-style Logic
*   **Shell**: Tauri (Rust) for native OS integration
*   **Compliance**: Custom standard-library modules for academic rigor

## 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for details on our "Pharma-Grade" code standards.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

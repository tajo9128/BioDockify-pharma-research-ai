# BioDockify v2.4.1 🧬

**The Integrated AI Research Workstation for Pharmaceutical & Life Sciences.**

BioDockify is a specialized, autonomous AI ecosystem designed to manage the entire research lifecycle for **PG students, PhD researchers, and pharmaceutical scientists**. It delivers "Pharma-Grade" intelligence by combining deep reasoning, robotic automation, and local-first privacy.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.4.1-green.svg)](https://github.com/tajo9128/BioDockify-pharma-research-ai)
[![Docker](https://img.shields.io/badge/docker-tajo9128%2Fbiodockify--ai-blue.svg)](https://hub.docker.com/r/tajo9128/biodockify-ai)
[![Privacy](https://img.shields.io/badge/privacy-Local--First-green.svg)]()

---

## 🏗️ The Four-Pillar Architecture

BioDockify is built on four core specialized engines that interact to provide research autonomy and privacy:

1.  **🧠 Agent Zero (The Reasoner)**: The central intelligence engine. Handles goal decomposition, research planning, and complex multi-step orchestration.
2.  **🤖 NanoBot (The Executor)**: The action layer. Manages tool execution, stealth browsing, and biological hardware (SiLA 2) interaction.
3.  **📚 SurfSense (The Knowledge Base)**: The deep research layer. Autonomously crawls, parses (GROBID), and indexes scientific literature.
4.  **🛡️ LM Studio (The Local Brain)**: The privacy layer. Enables **100% offline, zero-leakage reasoning** using locally-hosted models for sensitive data.

---

## 🌟 The Elite Skill Suite

Agent Zero is equipped with specialized "Skills" tailored for elite academic and clinical research:

*   **🎓 Achademio**: A specialized pharmaceutical research assistant that understands PhD-level scientific terminology and protocols.
*   **🏎️ Deep Drive**: An extreme research engine for high-depth investigation into niche pharmaceutical topics.
*   **🤝 Scholar Copilot**: Real-time collaborative research assistant for managing literature and hypothesis generation.
*   **🔍 Reviewer Agent**: Simulates a rigorous peer-review process to critique manuscripts, theses, and experimental designs.

---

## 🔬 Deep Pharma & Clinical Suite

Advanced modules for the frontlines of drug development and clinical validation:

*   **📊 Clinical Statistics (3-Tier)**: Advanced statistical engine supporting **Kaplan-Meier & Cox Regression (Survival Analysis)**, ANOVA, and Power Analysis.
*   **🧪 Molecular Vision**: Image-to-SMILES engine that converts chemical structure photos into machine-readable data.
*   **🔗 Lab Automation**: Generates **SiLA 2 compliant XML** protocols for liquid-handling robots (Tecan/Hamilton).
*   **💡 Scientific Method**: AI-assisted **Hypothesis Engine** for experimental design and mechanism-of-action discovery.

---

## 🎓 The Publication Engine

Automate everything from thesis drafting to journal submission:

*   **📗 Pharma-Thesis Factory**: Templates for **Pharmacology, Pharmaceutics, Chemistry, and Pharm.D** (Optimized for B.Pharm to PhD).
*   **📝 Systematic Review (LatteReview)**: Automated screening, scoring, and data abstraction for SLRs and scoping reviews.
*   **�️ Journal Intelligence**: AI-powered discovery of high-impact journals with impact factor analysis and submission verifiers.
*   **📽️ Multimedia Studio**: Auto-generate **Academic PowerPoint Slides**, Video presentation scripts, and **AI Podcasts**.

---

## 🕸️ The Knowledge Hub

Turn fragmented data into structured pharmaceutical intelligence:

*   **🕸️ Graph Builder**: Visualizes complex drug-disease-gene connections using **Neo4j Knowledge Graphs**.
*   **🧬 Bio-NER Engine**: Entity extraction specialized for proteins, genes, and drugs, integrated with global databases.
*   **📥 PDF Processor**: High-fidelity parsing of academic papers using **GROBID** to extract tables and citations.

---

## 🤖 Autonomic Resilience & Exploration

The system is designed to "Self-Heal" and bypass research roadblocks:

*   **🩹 Self-Healing**: Automated recovery from tool failures via `RepairableException` analysis and auto-fix generation.
*   **🕵️ Stealth Research**: Playwright-based "human-like" engine for bypassing bot detection on protected academic portals.
*   **🦁 Omni-Search**: Integrated **Brave Search** for real-time news and **Omni-Tools** for secure local PDF/Image processing.

---

## 🛡️ Enterprise Governance & Security

Ensuring your research meets the highest standards of integrity and compliance:

*   **📜 Security Audit**: Full GxP-ready audit logging and license validation for institutional research.
*   **⚖️ Academic Compliance**: Automated checks for plagiarism, citation integrity, and ethical standard alignment.
*   **🛡️ Multi-Channel Delivery**: Secure delivery of findings via **Email, Telegram, Discord, and WhatsApp**.

---

## 🚀 Quick Start (Docker - v2.4.1)

> **One-Click Installation** - Just like Agent Zero!

### 🐳 Via Docker Desktop (Recommended)

1. **Open Docker Desktop**
2. **Search** `tajo9128/biodockify-ai` in the search bar
3. Click **Pull** to download the latest image
4. Click **Run** → Set port mapping: `3000 → 3000` (Map host port 3000 to container port 3000)
5. **Open** [http://localhost:3000](http://localhost:3000)
6. **Install as Desktop App** → Click the install prompt in browser for PWA!

### 💻 Via Command Line (One-Click)

The standard `docker run` command is complex. We provide robust scripts to handle port mapping and data persistence for you.

**Windows:**
```powershell
.\run.bat
```

**Linux / Mac:**
```bash
chmod +x run.sh
./run.sh
```

These scripts will:
1. Check if Docker is running.
2. Stop/Remove any old container.
3. Start the ecosystem (App + DB + PDF Parser) using `docker-compose`.
    *   **Note:** This setup uses **LM Studio** on your host machine (port 1234).
4. Open your browser automatically to `http://localhost:3000`.

### 🔄 Update to Latest Version

```bash
# Stop and remove old container
docker stop biodockify && docker rm biodockify

# Pull latest and run
docker pull tajo9128/biodockify-ai:latest
docker run -d --name biodockify -p 3000:3000 -v biodockify-data:/app/data --restart unless-stopped tajo9128/biodockify-ai:latest
```

### 📋 Requirements

| Requirement | Minimum | Recommended |
|:---|:---|:---|
| **Docker Desktop** | 4.0+ | Latest |
| **RAM** | 8GB | 16GB+ |
| **Disk** | 10GB | 20GB |
| **GPU** | Optional | NVIDIA 8GB+ (for LM Studio) |

---

<p align="center">
  <b>BioDockify</b> - The Future of Pharma Research 🧬
</p>

# BioDockify v2.20.0 🧬

**The Premier Four-Pillar AI Research workstation for Pharmaceutical & Life Sciences.**

BioDockify is a specialized, autonomous AI ecosystem built to manage the entire research lifecycle for **PG students, PhD researchers, and pharmaceutical scientists**. It delivers "Pharma-Grade" intelligence by combining deep reasoning, robotic automation, and local-first privacy.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.20.0-green.svg)](https://github.com/tajo9128/BioDockify-pharma-research-ai)
[![Status](https://img.shields.io/badge/status-Production-teal.svg)]()
[![Platform](https://img.shields.io/badge/platform-Docker-blue.svg)]()

---

## 🏗️ The Four-Pillar Architecture

BioDockify is globally unique in its integration of four core specialized engines:

1.  **🧠 Agent Zero (The Reasoner)**: The central intelligence engine. Handles goal decomposition, research planning, and complex pharmaceutical reasoning.
2.  **🤖 NanoBot (The Executor)**: The action layer. Manages tool execution, stealth browsing, and biological hardware (SiLA 2) interaction.
3.  **📚 SurfSense (The Knowledge Base)**: The deep research layer. autonomously crawls, parses (GROBID), and indexes (Neo4j) the academic corpus.
4.  **🛡️ LM Studio (The Local Brain)**: The privacy layer. Enables **100% offline, zero-leakage reasoning** using locally-hosted LLMs for sensitive clinical data.

---

## � Deep Pharma & Clinical Suite

Specialized modules for the frontlines of pharmaceutical development and clinical validation:

*   **📊 Clinical Statistics (3-Tier)**: Advanced statistical engine supporting **Kaplan-Meier & Cox Regression (Survival Analysis)**, ANOVA, and Power Analysis with professional methodology generation.
*   **🧪 Molecular Vision**: Image-to-SMILES engine that converts chemical structure photos into machine-readable data.
*   **🧬 Bio-Intelligence**: Specialized **Bio-NER** for gene/protein extraction, integrated with PubTator and a literary **Hypothesis Engine**.
*   **🔗 Lab Automation**: Generates **SiLA 2 compliant XML** protocols for liquid-handling robots (Tecan/Hamilton).

---

## 🎓 Academic Publishing Factory

Automate the "last mile" of scholarly production with specialist tools:

*   **📗 Pharma-Thesis Factory**: Targeted templates for **Pharmacology, Pharmaceutics, Chemistry, and Pharm.D** (optimized for B.Pharm, M.Pharm, and PhD levels).
*   **📝 Systematic Review (LatteReview)**: semi-autonomous screening, scoring, and data abstraction for SLRs and scoping reviews.
*   **📽️ Multimedia Studio**: Transform research data into professional **PowerPoint Slides**, Video scripts, and **AI Podcasts** for conferences.

---

## 🤖 Autonomic Resilience & Connectivity

The system is designed to "Self-Heal" and operate with minimal user intervention:

*   **🩹 Self-Healing**: Automated recovery from tool failures via `RepairableException` analysis and auto-fix generation.
*   **🕵️ Stealth Research**: Playwright-based "human-like" browser engine for bypassing bot detection on protected academic portals.
*   **🦁 Omni-Search**: Integrated **Brave Search** for real-time clinical news and **Omni-Tools** for secure local PDF/Image processing.
*   **� Multi-Channel Delivery**: Automated research alerts via **Email, Telegram, Discord, and WhatsApp**.

---

## � Deployment Matrix

### 📋 Prerequisites
- **RAM**: 16GB Minimum (32GB+ for Knowledge Graphs).
- **GPU**: NVIDIA (8GB+ VRAM) for Private AI; Cloud APIs supported.
- **Docker**: Required for full-stack orchestration.

| Path | Command / Method | Best For |
| :--- | :--- | :--- |
| **🐳 Local Desktop** | `docker-compose up -d` | Personal Workstation / Windows |
| **🛡️ Private AI** | Connect to **LM Studio** (Port 1234) | Maximum Privacy / Sensitive Data |
| **☁️ Enterprise VPS** | `docker-compose -f docker-compose.yml up -d` | Large Labs / Shared Instances |

### 🏁 Quick Start
```bash
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai
docker-compose up -d
```
*Launch your research workstation at `http://localhost:5173`.*

---

<p align="center">
  <b>BioDockify</b> - Empowering the next generation of Pharma Scientists 🧬
</p>

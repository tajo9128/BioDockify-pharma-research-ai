# BioDockify v2.18.7 🧬

**AI-Powered Research Assistant for Pharmaceutical & Life Sciences**

BioDockify is a local-first, privacy-preserving AI workstation designed for **PG students, PhD researchers, and pharmaceutical scientists**. It transforms LLMs into "Pharma-Grade" research assistants capable of deep literature analysis, thesis writing, and academic synthesis.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.18.7-green.svg)](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
[![Status](https://img.shields.io/badge/status-Production-teal.svg)]()
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)]()

---

## 🚀 What's New in v2.18.7

- ✅ **Student-Friendly First Run Wizard** - Easy setup with clear step-by-step guidance
- ✅ **LM Studio Integration** - Run AI locally with LM Studio (no API keys needed!)
- ✅ **Free License Verification** - Register at biodockify.com to unlock all features
- ✅ **PhD Thesis Generator** - AI-assisted thesis chapter generation
- ✅ **Presentation Slides** - Generate academic slides from your research
- ✅ **Google Drive Backup** - Cloud backup for your research data

---

## ✨ Key Features

### 🧠 Agent Zero - The Intelligence Core
| Feature | Description |
|---------|-------------|
| **LM Studio (Local)** | Run AI offline with any LM Studio model |
| **Multi-Provider Support** | Google Gemini, OpenRouter, DeepSeek, GLM-4, HuggingFace |
| **Intelligent Fallback** | Automatically switches provider if one fails |
| **Persona-Aware** | Adapts responses based on your role (PG Student, PhD Student, Senior Researcher) |

### 📚 Research Tools
| Tool | Description |
|------|-------------|
| **Research Workstation** | Plan and execute research tasks |
| **PhD Thesis Generator** | AI-assisted thesis chapters with citations |
| **Presentation Slides** | Generate academic presentations |
| **Scientific Method** | Structured hypothesis builder |
| **Virtual Lab** | Generate lab protocols |
| **Statistics Engine** | 3-tier data analysis tools |
| **Journal Authenticity** | Verify journal legitimacy |

### 📖 Literature Sources
- **Free**: PubMed, PMC, OpenAlex, ClinicalTrials.gov, Semantic Scholar, bioRxiv, chemRxiv
- **Optional**: Elsevier/Scopus (API key), Web of Science

### 🛡️ Privacy & Security
- **Local-First**: All data stored on your computer
- **No Data Collection**: Your research stays private
- **Offline Capable**: Works without internet (with local AI)

---

## 💻 Installation

### Quick Install (Recommended)
1. Download `BioDockify-Setup.exe` from [Releases](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
2. Run the installer
3. Follow the First Run Wizard 🧙‍♂️

### First Run Setup
The wizard will guide you through:
1. ⚡ System compatibility check
2. 🧠 LM Studio AI connection
3. ⚙️ Settings confirmation
4. 📧 Free account registration
5. ✅ License verification

### Prerequisites for Local AI
- **LM Studio** - Download from [lmstudio.ai](https://lmstudio.ai)
- Load any model (e.g., Llama 3, Mistral, Qwen)
- BioDockify auto-detects running models!

---

## 🔧 Build from Source

```bash
# Clone
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai

# Backend
pip install -r requirements.txt

# Frontend
cd ui && npm install

# Desktop App
cd ../desktop/tauri && npm install && npm run tauri build
```

---

## ⚙️ Configuration

Access settings via **Settings** in the sidebar.

### 🧠 AI Provider
| Option | Description |
|--------|-------------|
| **LM Studio** | Local AI (recommended) |
| **Google Gemini** | Fast cloud inference (free tier) |
| **DeepSeek** | Cost-effective reasoning model |
| **OpenRouter** | Access 100+ models |

### 👤 Persona
| Setting | Options |
|---------|---------|
| Role | PG Student, PhD Student, Senior Researcher, Industry Scientist |
| Strictness | Exploratory, Balanced, Conservative |

### 📄 Output
| Setting | Options |
|---------|---------|
| Format | Markdown, PDF, DOCX, LaTeX |
| Citation Style | APA, Nature, IEEE, Chicago |

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10+ | Windows 11 |
| RAM | 8 GB | 16 GB |
| Storage | 2 GB | 10 GB (with AI models) |
| GPU | Not required | NVIDIA (faster AI) |

---

## 🏗️ Architecture

```
BioDockify/
├── ui/                    # Next.js Frontend
├── api/                   # FastAPI Backend
├── agent_zero/            # AI Orchestration
├── modules/
│   ├── thesis/           # PhD Thesis Generator
│   ├── slides/           # Presentation Generator
│   ├── statistics/       # Data Analysis
│   ├── literature/       # Paper Retrieval
│   └── backup/           # Google Drive Backup
├── desktop/tauri/        # Tauri Desktop App
└── installer/            # NSIS Installer
```

### Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Python FastAPI
- **Desktop**: Tauri (Rust)
- **AI**: LM Studio, Ollama, or Cloud APIs
- **Database**: Supabase (license verification)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push (`git push origin feature/NewFeature`)
5. Open Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE)

---

## 🔗 Links

- **Website**: [www.biodockify.com](https://www.biodockify.com)
- **Releases**: [Downloads](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
- **Issues**: [Report Bug](https://github.com/tajo9128/BioDockify-pharma-research-ai/issues)

---

<p align="center">
  <b>BioDockify</b> - Your AI Research Partner 🧬
</p>

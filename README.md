# BioDockify v2.14.3 🧬

**Autonomous AI Research Assistant for Pharmaceutical & Life Sciences**

BioDockify is a local-first, privacy-preserving AI workstation designed for pharmaceutical researchers, PhD students, and drug discovery scientists. It transforms LLMs into "Pharma-Grade" research assistants capable of deep literature analysis, hypothesis generation, and academic synthesis.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.14.3-green.svg)](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
[![Status](https://img.shields.io/badge/status-Production-teal.svg)]()
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)]()

---

## ✨ Key Features

### 🧠 Agent Zero - The Intelligence Core
| Feature | Description |
|---------|-------------|
| **Multi-Provider AI** | Works with Ollama (local), Google Gemini, OpenRouter, GLM-4.7, HuggingFace, or any OpenAI-compatible API |
| **Intelligent Fallback** | Automatically tries next provider if one fails |
| **Persona-Aware** | Adapts responses based on your role (PhD Student, PG Student, Senior Researcher, Industry Scientist) |
| **Evidence-Driven** | Refuses to generate claims without cited sources |

### 📚 SurfSense Knowledge Engine
| Feature | Description |
|---------|-------------|
| **Document Ingestion** | Upload PDFs, Word docs, notebooks, and data files |
| **Semantic Search** | AI-powered search across your knowledge base |
| **Auto-Indexing** | Automatically processes and indexes uploaded files |

### 🔬 Research Tools
| Tool | Description |
|------|-------------|
| **Workstation** | Plan and execute research tasks |
| **Scientific Method** | Structured hypothesis builder |
| **Virtual Lab** | Generate lab protocols |
| **Publication Assistant** | Academic writing support |
| **Statistics Engine** | Data analysis tools |
| **Journal Authenticity Checker** | Verify journal legitimacy |

### 📖 Literature Sources
- **Free**: PubMed, PMC, OpenAlex, ClinicalTrials.gov, Semantic Scholar
- **Optional**: Elsevier/Scopus (API key required), Web of Science

### 🛡️ Safety & Compliance
- **Citation Lock**: Forces evidence-based responses
- **Conflict Detection**: Highlights contradictory evidence
- **Local-First**: All data stored locally, never sent to third parties

---

## 🚀 Installation

### Option 1: Download Release (Recommended)
1. Go to [Releases](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
2. Download `BioDockify-Setup.exe` for Windows
3. Run the installer

### Option 2: Build from Source

#### Prerequisites
- **Python 3.10+** 
- **Node.js 18+** 
- **Rust** (for Tauri)
- **Docker** (optional, for SurfSense)
- **Ollama** (optional, for local AI)

#### Steps

```bash
# 1. Clone the repository
git clone https://github.com/tajo9128/BioDockify-pharma-research-ai.git
cd BioDockify-pharma-research-ai

# 2. Install backend dependencies
pip install -r requirements.txt

# 3. Install frontend dependencies
cd ui
npm install

# 4. Build the desktop app
cd ../desktop/tauri
npm install
npm run tauri build

# The installer will be in: desktop/tauri/src-tauri/target/release/bundle/
```

#### Running in Development
```bash
# Start backend (from root)
python api/main.py

# Start frontend (from ui/)
npm run dev

# Or run full Tauri app
npm run tauri dev
```

---

## ⚙️ Configuration

Access settings via the **gear icon** in the sidebar or **File → Open Settings**.

### 🧠 Brain Tab (Local AI)
| Setting | Description | Default |
|---------|-------------|---------|
| Ollama URL | Local Ollama server | `http://localhost:11434` |
| Model | Selected Ollama model | Auto-detected |
| SurfSense URL | Knowledge engine | `http://localhost:3003` |

### ☁️ Cloud Tab (API Keys)
| Provider | Purpose |
|----------|---------|
| Google Gemini | Fast cloud inference |
| OpenRouter | Access to multiple models |
| HuggingFace | Free inference API |
| Custom API | Any OpenAI-compatible endpoint (GLM-4.7, Groq, etc.) |

### 📚 Research Tab
Configure literature sources:
- Toggle individual databases (PubMed, PMC, OpenAlex, etc.)
- Set citation threshold (Low/Medium/High)

### 👤 Persona Tab
| Setting | Options |
|---------|---------|
| Role | PhD Student, PG Student, Senior Researcher, Industry Scientist |
| Strictness | Exploratory, Balanced, Conservative |
| Introduction | Your profile for personalized responses |
| Research Focus | Your area of expertise |

### 📄 Output Tab
| Setting | Options |
|---------|---------|
| Format | Markdown, PDF, DOCX, LaTeX |
| Citation Style | APA, Nature, IEEE, Chicago |
| Include Disclosure | Yes/No |
| Output Directory | Where to save exports |

---

## 🏗️ Architecture

```
BioDockify/
├── ui/                    # Next.js 15 Frontend
├── api/                   # FastAPI Backend
├── runtime/               # Python orchestration
├── modules/               # Feature modules
│   ├── library/          # Document storage
│   ├── journal_intel/    # Journal verification
│   ├── knowledge/        # SurfSense client
│   ├── rag/              # Vector search
│   └── statistics/       # Data analysis
├── desktop/tauri/        # Tauri desktop shell
└── installer/            # NSIS installer
```

### Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Python FastAPI
- **Desktop**: Tauri (Rust)
- **Knowledge Engine**: SurfSense (Docker)
- **Local AI**: Ollama

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10+ | Windows 11 |
| RAM | 8 GB | 16 GB |
| Storage | 2 GB | 10 GB (with models) |
| GPU | Not required | NVIDIA (for local AI) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **Repository**: [GitHub](https://github.com/tajo9128/BioDockify-pharma-research-ai)
- **Releases**: [Downloads](https://github.com/tajo9128/BioDockify-pharma-research-ai/releases)
- **Issues**: [Report Bug](https://github.com/tajo9128/BioDockify-pharma-research-ai/issues)

---

<p align="center">
  <b>BioDockify</b> - Analyze research, automate academic workflows.
</p>

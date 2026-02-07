# BioDockify v2.20.0 - Deployment Guide

Complete PhD Research Automation Platform with Agent Zero orchestration, 40+ integrated tools, and real-time AI-powered research workflow.

---

## 🚀 Quick Start (Docker Desktop)

> **One-Click Installation** - Search and run like Agent Zero!

### Method 1: Docker Desktop GUI (Recommended)

1. **Open Docker Desktop**
2. **Search** `biodockify/biodockify` in the search bar at the top
3. **Pull** - Click to download the image (~1.5GB)
4. **Run** - Click Run and configure:
   - **Port:** Map container port `80` → host port `50081`
   - **Volume (optional):** Map `/biodockify/data` for data persistence
5. **Access** - Open http://localhost:50081

### Method 2: Command Line

```bash
# Pull the latest image
docker pull biodockify/biodockify:latest

# Run with data persistence (recommended)
docker run -d \
  -p 50081:80 \
  -v biodockify-data:/biodockify/data \
  --name biodockify \
  biodockify/biodockify:latest

# Access the application
open http://localhost:50081
```

### Method 3: Docker Compose (Full Stack)

For development or when you need separate services (Neo4j, GROBID, Ollama):

```bash
docker-compose up -d
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8234
- **Neo4j Browser**: http://localhost:7474
- **GROBID**: http://localhost:8070

---

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                    │
│              (Next.js 15 + TypeScript + shadcn/ui)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / SSE
┌────────────────────▼────────────────────────────────────┐
│                   API Routes                             │
│         /api/v2/agent/* - Goal & Thinking endpoints      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Agent Zero                             │
│          (Orchestration & Task Management)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Tool Registry                            │
│              8 Core Tools Implemented                    │
│              (Extensible to 40+)                         │
└────┬─────────┬─────────┬─────────┬─────────┬────────────┘
     │         │         │         │         │
     ▼         ▼         ▼         ▼         ▼
  GROBID    Neo4j    Ollama   PubMed    Local
  (8070)   (7687)   (11434)  Search    Processing
```

## 🔧 Components

### Frontend Dashboard (`src/app/page.tsx`)
- **Goal Input**: Define research objectives with stage selection
- **Real-time Thinking Stream**: Watch Agent Zero's decision-making
- **Task Progress**: Track execution status and completion
- **Tool Registry**: Browse available tools by category
- **System Status**: Monitor all Docker services

### Agent Zero Core (`src/lib/agent-zero.ts`)
- **Goal Decomposition**: Break down goals into executable tasks
- **Task Execution**: Manage task dependencies and execution order
- **Tool Orchestration**: Select and execute appropriate tools
- **Result Aggregation**: Combine and validate results
- **Thinking Stream**: Real-time logging of decisions

### Tool Suite (`src/lib/tools/`)

#### Literature Tools
- **PubMedSearchTool**: Search academic literature
- **GROBIDParserTool**: Parse PDFs and extract metadata

#### Analysis Tools
- **SciBERTEmbedderTool**: Generate semantic embeddings
- **BERTopicTool**: Extract research themes and topics
- **Neo4jConnectorTool**: Manage knowledge graph operations

#### Generation Tools
- **LLMGenerateTool**: Generate text using Ollama LLM

#### Export Tools
- **LaTeXGeneratorTool**: Generate LaTeX documents
- **DOCXGeneratorTool**: Generate Word documents

### Persistent Memory (`src/lib/memory.ts`)
- **PhDProgress Tracking**: Track progress by research stage
- **Milestone Management**: Define and complete milestones
- **Result Storage**: Store task results and thinking logs
- **Database Integration**: SQLite via Prisma ORM

### API Routes

#### POST `/api/v2/agent/goal`
Execute a research goal through Agent Zero.

**Request:**
```json
{
  "goal": "Conduct literature review on Alzheimer's disease",
  "stage": "early"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": "uuid",
  "message": "Agent Zero started",
  "stage": "early"
}
```

#### GET `/api/v2/agent/thinking`
Real-time Server-Sent Events stream of Agent Zero's thinking process.

**Response:** SSE stream with thinking steps:
```json
{
  "type": "decomposition",
  "description": "Breaking down goal into tasks...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "tool": "pubmed_search"
}
```

## 🐳 Docker Services

### GROBID (Port 8070)
PDF parsing and metadata extraction service.

- **Health Check**: `http://localhost:8070/api/version`
- **Documentation**: https://grobid.readthedocs.io/

### Neo4j (Ports 7474, 7687)
Knowledge graph database for research connections.

- **HTTP**: `http://localhost:7474` (Neo4j Browser)
- **Bolt**: `bolt://localhost:7687`
- **Credentials**: neo4j / biodockify2024
- **Documentation**: https://neo4j.com/docs/

### Ollama (Port 11434)
Large Language Model for text generation.

- **API**: `http://localhost:11434/api/tags`
- **Models**: llama3.2 (pre-configured)
- **Documentation**: https://ollama.ai/docs/

## 🧪 Integration Tests

Run the comprehensive test suite:

```bash
cd tests/integration
python test_phd_pipeline.py
```

**Test Coverage:**
- ✓ Literature review pipeline
- ✓ Hypothesis generation
- ✓ API endpoint validation
- ✓ Docker service connectivity
- ✓ Frontend load testing
- ✓ Error handling
- ✓ Export functionality (LaTeX, DOCX)
- ✓ Concurrent request handling

## 📊 Research Stages

### Early Stage
- Literature search and review
- PDF parsing and extraction
- Semantic analysis
- Theme extraction

### Middle Stage
- Research analysis
- Hypothesis generation
- Knowledge graph building
- Data correlation

### Late Stage
- Findings synthesis
- Document generation (LaTeX, DOCX)
- Final thesis preparation
- Export and formatting

## 🔍 Usage Examples

### 1. Literature Review

```bash
curl -X POST http://localhost:3000/api/v2/agent/goal \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Conduct literature review on Alzheimer's disease biomarkers",
    "stage": "early"
  }'
```

### 2. Hypothesis Generation

```bash
curl -X POST http://localhost:3000/api/v2/agent/goal \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Generate hypotheses for novel drug targets in cancer immunotherapy",
    "stage": "middle"
  }'
```

### 3. Thesis Generation

```bash
curl -X POST http://localhost:3000/api/v2/agent/goal \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Generate final thesis based on research findings",
    "stage": "late"
  }'
```

## 🛠️ Development Commands

```bash
# Start development server
bun run dev

# Run linter
bun run lint

# Push database schema changes
bun run db:push

# Start Docker services
docker-compose up -d

# Stop Docker services
docker-compose down

# View Docker logs
docker-compose logs -f

# Restart specific service
docker-compose restart grobid
```

## 📈 Progress Tracking

BioDockify automatically tracks PhD progress across stages:

- **Early Stage**: Literature review, data collection
- **Middle Stage**: Analysis, hypothesis development
- **Late Stage**: Synthesis, thesis writing

Progress is stored in the database and displayed in the dashboard.

## 🔐 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
DATABASE_URL="file:./db/custom.db"

# Docker Service URLs
GROBID_URL=http://localhost:8070
NEO4J_URI=bolt://localhost:7687
NEO4J_PASSWORD=biodockify2024
OLLAMA_URL=http://localhost:11434
```

### Prisma Schema
Update `prisma/schema.prisma` and run:
```bash
bun run db:push
```

## 📝 Project Structure

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/v2/agent/
│   │   │   ├── goal/route.ts          # Goal execution API
│   │   │   └── thinking/route.ts      # Thinking stream API
│   │   ├── page.tsx                   # Frontend dashboard
│   │   └── layout.tsx                 # App layout
│   ├── lib/
│   │   ├── agent-zero.ts              # Agent Zero core
│   │   ├── memory.ts                  # Persistent memory
│   │   └── tools/
│   │       ├── base.ts                # Tool base class
│   │       ├── tool-registry.ts       # Tool registry
│   │       ├── pubmed-search.ts       # Literature search
│   │       ├── grobid-parser.ts       # PDF parsing
│   │       ├── scibert-embedder.ts    # Semantic embeddings
│   │       ├── bertopic-extractor.ts  # Topic extraction
│   │       ├── neo4j-connector.ts     # Knowledge graph
│   │       ├── llm-generate.ts        # LLM text generation
│   │       ├── latex-generator.ts     # LaTeX export
│   │       └── docx-generator.ts      # DOCX export
│   └── components/ui/                # shadcn/ui components
├── prisma/
│   └── schema.prisma                  # Database schema
├── tests/
│   └── integration/
│       └── test_phd_pipeline.py       # Integration tests
├── deployment/
│   └── deploy.sh                      # Deployment script
├── docker-compose.yml                 # Docker services
└── package.json                       # Dependencies
```

## 🚧 Extending the Platform

### Adding New Tools

1. **Create tool class** extending `BaseTool`:
```typescript
import { BaseTool, ToolConfig } from './base'

export class MyTool extends BaseTool {
  public readonly config: ToolConfig = {
    name: 'my_tool',
    description: 'Tool description',
    category: 'analysis',
    version: '1.0.0',
    requiredParams: ['input'],
    optionalParams: []
  }

  async execute(input: ToolInput) {
    // Implementation
  }
}
```

2. **Register tool** in `tool-registry.ts`:
```typescript
this.register(new MyTool())
```

3. **Tool is now available** to Agent Zero

### Adding New Docker Services

1. Add service to `docker-compose.yml`
2. Update environment variables
3. Add health check to deployment script
4. Restart services

## 🐛 Troubleshooting

### Docker Services Not Starting
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

### Database Issues
```bash
# Reset database
rm db/custom.db
bun run db:push
```

### Frontend Not Loading
```bash
# Clear Next.js cache
rm -rf .next
bun run dev
```

## 📄 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**BioDockify v2.0.0** - Empowering PhD Research with AI Automation

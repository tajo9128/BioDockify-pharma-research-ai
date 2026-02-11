# BioDockify Pharma Research AI - Debug & Launch Plan

**Date:** February 10, 2026
**Version:** v2.4.9
**Repository:** tajo9128/BioDockify-pharma-research-ai

---

## 📊 System Analysis

### Project Structure
```
BioDockify-pharma-research-ai/
├── api/               # FastAPI backend
├── ui/                # Next.js 15 frontend (not present - likely built into /)
├── modules/           # 41 specialized modules
├── agent_zero/        # Intelligence orchestrator
├── nanobot/           # Action execution layer
├── orchestration/     # Research planning
├── services/          # Background services
├── docker-compose.yml  # Full stack deployment
├── Dockerfile         # Multi-stage build
├── server.py         # Entry point
└── run.sh           # One-click launcher
```

### Tech Stack

| Layer | Technology | Purpose |
|--------|-------------|---------|
| **Frontend** | Next.js 15, React 19, Tailwind 4 | UI/dashboard |
| **Backend** | FastAPI, Python 3.11 | API & orchestration |
| **Database** | PostgreSQL 15, ChromaDB | Task manager, vector store |
| **Cache** | Redis 7 | Cache & queue |
| **Monitoring** | Grafana, Prometheus, Loki | Metrics & logs |
| **PDF Parser** | GROBID | Academic paper parsing |

---

## 🐛 Debug Checklist

### ❌ Issue 1: Port Conflicts

**Current docker-compose.yml port mappings:**
```yaml
ports:
  - "8234:3000"      # App (OK)
  - "5432:5432"      # PostgreSQL (OK)
  - "6379:6379"      # Redis (⚠️ CONFLICTS with BillionMail)
  - "8001:8000"      # ChromaDB (OK)
  - "9090:9090"      # Prometheus (OK)
  - "3000:3000"      # Grafana (❌ CONFLICTS!)
  - "3100:3100"      # Loki (OK)
  - "8070:8070"      # GROBID (OK)
```

**Conflicts detected:**
1. **Port 3000** - Grafana conflicts with Next.js (should be 3001)
2. **Port 6379** - Redis conflicts with BillionMail's 6379

**Fix Required:**
```yaml
# Update docker-compose.yml
grafana:
  ports:
    - "3001:3000"  # Changed from 3000:3000

redis:
  ports:
    - "16379:6379"  # Changed from 6379:6379 to avoid BillionMail
```

### ⚠️ Issue 2: Missing .env File

**Required environment variables:**
```bash
# AI Providers (at least one needed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...

# Neo4j (optional, for graph features)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASS=password

# LM Studio (local LLM, optional)
LM_STUDIO_URL=http://host.docker.internal:1234
```

**Action:** Create `.env` file in project root with API keys.

### ⚠️ Issue 3: Missing UI Directory

**Observation:** No `ui/` directory found, but Dockerfile references it.

**Expected structure:**
```
/ui/package.json
/ui/bun.lock
/ui/  # Next.js source
```

**Possible causes:**
1. UI built externally and missing from repo
2. UI is in a different branch
3. Dockerfile expects `/` as UI root (not `/ui`)

**Action:** Verify UI source location or build from root.

---

## 🚀 Launch Steps

### Step 1: Fix Port Conflicts

Edit `docker-compose.yml`:

```bash
cd /home/biodockify/.openclaw/workspace/BioDockify-pharma-research-ai
nano docker-compose.yml
```

**Changes to make:**
1. Find Grafana service, change `3000:3000` to `3001:3000`
2. Find Redis service, change `6379:6379` to `16379:6379`

### Step 2: Create .env File

```bash
cd /home/biodockify/.openclaw/workspace/BioDockify-pharma-research-ai
cat > .env << 'EOF'
# AI Providers (choose at least one)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Neo4j (optional - comment out if not using)
# NEO4J_URI=bolt://localhost:7687
# NEO4J_USER=neo4j
# NEO4J_PASS=password

# LM Studio (local LLM - optional)
LM_STUDIO_URL=http://host.docker.internal:1234
EOF
```

**Note:** Replace API keys with actual values.

### Step 3: Build & Launch

**Option A: Use run.sh script (recommended)**
```bash
chmod +x run.sh
./run.sh
```

**Option B: Use docker-compose directly**
```bash
docker compose up -d --build
```

**Option C: Use provided Docker image**
```bash
docker pull tajo9128/biodockify-ai:latest
docker run -d \
  -p 8234:3000 \
  --name biodockify \
  -v biodockify-data:/app/data \
  --restart unless-stopped \
  tajo9128/biodockify-ai:latest
```

### Step 4: Verify Services

```bash
# Check container status
docker ps | grep biodockify

# Check logs
docker logs biodockify-app -f

# Test health endpoint
curl http://localhost:8234/api/health
```

**Expected response:**
```json
{"status": "healthy", "timestamp": 1739230000.123}
```

---

## 🔍 Troubleshooting Commands

### Check Container Status
```bash
docker compose ps
```

### View All Logs
```bash
docker compose logs -f
```

### View Specific Service Logs
```bash
docker logs biodockify-app -f          # Main application
docker logs biodockify-postgres -f       # Database
docker logs biodockify-grafana -f       # Monitoring
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Stop & Clean
```bash
docker compose down

# Stop with volumes (⚠️ deletes data!)
docker compose down -v
```

### Check Port Usage
```bash
netstat -tulpn | grep -E "3000|3001|5432|6379|8234|9090"
```

---

## 📊 Service Access Points (After Launch)

| Service | URL | Purpose |
|----------|------|---------|
| **Main App** | http://localhost:8234 | BioDockify interface |
| **Grafana** | http://localhost:3001 | Monitoring dashboard |
| **Prometheus** | http://localhost:9090 | Metrics storage |
| **Loki** | http://localhost:3100 | Log viewer |
| **GROBID** | http://localhost:8070 | PDF parser API |

---

## 🎯 Success Criteria

### Phase 1: System Up
- ✅ All 8 Docker containers running
- ✅ Health endpoint returns 200 OK
- ✅ No port conflicts
- ✅ No container restart loops

### Phase 2: Basic Functionality
- ✅ UI loads at http://localhost:8234
- ✅ Can create a research project
- ✅ Can run a simple task
- ✅ AI responds (with API key configured)

### Phase 3: Full Features
- ✅ PDF parsing works (GROBID)
- ✅ Vector search works (ChromaDB)
- ✅ Graph features work (Neo4j, if configured)
- ✅ Monitoring works (Grafana/Prometheus)

---

## 📝 Next Steps

1. **Immediate:** Fix port conflicts in docker-compose.yml
2. **Immediate:** Create .env with API keys
3. **Launch:** Run `./run.sh` or `docker compose up -d`
4. **Verify:** Check logs and test health endpoint
5. **Debug:** Fix any startup errors based on logs

---

## 🚨 Known Issues from Git History

Recent fixes in repository:
- ✅ v2.4.9: Production release (Feb 10, 2026)
- ✅ v2.4.8: Version sync & build optimization
- ✅ v2.4.7: ESLint fixes, TypeScript conflicts resolved
- ✅ v2.4.6: Docker build failure resolved (invalid lockfiles removed)

**Potential residual issues:**
- Type strictness errors in external modules
- Missing lockfiles causing build failures
- CSS 404 issues (mentioned in README, fixed in v2.4.0+)

---

**Status:** Ready to launch after fixes applied.

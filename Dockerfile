# =============================================================================
# BioDockify v2.20.0 - Unified Production Dockerfile
# =============================================================================
# Install via Docker Desktop: Search "biodockify/biodockify" → Pull → Run
# 
# Quick Start (CLI):
#   docker pull biodockify/biodockify:latest
#   docker run -d -p 50081:80 -v biodockify-data:/biodockify/data biodockify/biodockify
#   Open: http://localhost:50081
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Frontend Builder (Bun/Next.js)
# -----------------------------------------------------------------------------
FROM oven/bun:1.1-alpine AS frontend-builder

WORKDIR /app/ui

# Install dependencies
COPY ui/package.json ui/bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY ui/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 2: Backend Builder (Python with Heavy Dependencies)
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS backend-builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Force install heavy dependencies (TensorFlow, DECIMER)
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    decimer>=2.2.0 \
    rdkit>=2023.9.4 \
    numpy>=1.26.3,<2.0.0 \
    Pillow>=10.2.0

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

LABEL maintainer="BioDockify AI <support@biodockify.ai>"
LABEL description="BioDockify Pharma Research AI - Docker Edition"
LABEL version="2.20.0"

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV BIODOCKIFY_DATA=/biodockify/data

WORKDIR /app

# Install runtime dependencies + nginx + supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend server
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy frontend build
COPY --from=frontend-builder /app/ui/.next/standalone /app/ui/
COPY --from=frontend-builder /app/ui/.next/static /app/ui/.next/static
COPY --from=frontend-builder /app/ui/public /app/ui/public

# Copy backend application
COPY api/ /app/api/
COPY agent_zero/ /app/agent_zero/
COPY modules/ /app/modules/
COPY orchestration/ /app/orchestration/
COPY services/ /app/services/
COPY nlp/ /app/nlp/
COPY nanobot/ /app/nanobot/
COPY nanobot_bridge/ /app/nanobot_bridge/
COPY server.py /app/
COPY runtime/ /app/runtime/

# Create data directory
RUN mkdir -p /biodockify/data /var/log/biodockify

# Configure nginx
RUN rm /etc/nginx/sites-enabled/default || true
COPY <<'NGINX' /etc/nginx/conf.d/biodockify.conf
server {
    listen 80;
    server_name _;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8234/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINX

# Configure supervisor
COPY <<'SUPERVISOR' /etc/supervisor/conf.d/biodockify.conf
[supervisord]
nodaemon=true
logfile=/var/log/biodockify/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/var/log/biodockify/nginx.log
stderr_logfile=/var/log/biodockify/nginx-error.log

[program:backend]
command=python /app/server.py
directory=/app
autostart=true
autorestart=true
stdout_logfile=/var/log/biodockify/backend.log
stderr_logfile=/var/log/biodockify/backend-error.log
environment=PYTHONPATH="/app"

[program:frontend]
command=node /app/ui/server.js
directory=/app/ui
autostart=true
autorestart=true
stdout_logfile=/var/log/biodockify/frontend.log
stderr_logfile=/var/log/biodockify/frontend-error.log
environment=PORT="3000",HOSTNAME="0.0.0.0"
SUPERVISOR

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Volume for persistent data
VOLUME ["/biodockify/data"]

# Start supervisor (manages nginx, backend, frontend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]

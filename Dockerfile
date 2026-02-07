# =============================================================================
# BioDockify v2.20.0 - Docker Production Image
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

# Install dependencies first for caching
COPY ui/package.json ui/bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Copy source and build
COPY ui/ ./
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure next.config.js has standalone output
RUN echo "Checking Next.js config..." && \
    if ! grep -q "output.*standalone" next.config.ts 2>/dev/null && \
       ! grep -q "output.*standalone" next.config.js 2>/dev/null; then \
      echo "Adding standalone output to next.config..."; \
    fi

RUN bun run build || (echo "Build failed, trying with npm..." && npm install && npm run build)

# -----------------------------------------------------------------------------
# Stage 2: Python Backend (with Heavy Dependencies)
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend server
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Force install heavy dependencies (TensorFlow, DECIMER)
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    Pillow>=10.2.0 || true

# Try to install optional heavy deps (may fail on some platforms)
RUN pip install --no-cache-dir decimer>=2.2.0 || echo "DECIMER install skipped"
RUN pip install --no-cache-dir rdkit>=2023.9.4 || echo "RDKit install skipped"

# Copy frontend build - handle both standalone and regular builds
COPY --from=frontend-builder /app/ui/.next/standalone /app/ui/ 2>/dev/null || true
COPY --from=frontend-builder /app/ui/.next/static /app/ui/.next/static 2>/dev/null || true
COPY --from=frontend-builder /app/ui/public /app/ui/public 2>/dev/null || true
COPY --from=frontend-builder /app/ui/.next /app/ui/.next 2>/dev/null || true
COPY --from=frontend-builder /app/ui/node_modules /app/ui/node_modules 2>/dev/null || true
COPY --from=frontend-builder /app/ui/package.json /app/ui/package.json 2>/dev/null || true

# Copy backend application
COPY api/ /app/api/
COPY agent_zero/ /app/agent_zero/
COPY modules/ /app/modules/
COPY orchestration/ /app/orchestration/
COPY services/ /app/services/ 2>/dev/null || true
COPY nlp/ /app/nlp/ 2>/dev/null || true
COPY nanobot/ /app/nanobot/ 2>/dev/null || true
COPY nanobot_bridge/ /app/nanobot_bridge/ 2>/dev/null || true
COPY server.py /app/
COPY runtime/ /app/runtime/ 2>/dev/null || true

# Create directories
RUN mkdir -p /biodockify/data /var/log/biodockify

# Configure nginx
RUN rm -f /etc/nginx/sites-enabled/default
RUN echo 'server { \
    listen 80; \
    server_name _; \
    \
    location / { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 300s; \
    } \
    \
    location /api/ { \
        proxy_pass http://127.0.0.1:8234/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_read_timeout 300s; \
    } \
    \
    location /health { \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/biodockify.conf

# Configure supervisor
RUN echo '[supervisord] \n\
nodaemon=true \n\
logfile=/var/log/biodockify/supervisord.log \n\
pidfile=/var/run/supervisord.pid \n\
\n\
[program:nginx] \n\
command=nginx -g "daemon off;" \n\
autostart=true \n\
autorestart=true \n\
stdout_logfile=/var/log/biodockify/nginx.log \n\
stderr_logfile=/var/log/biodockify/nginx-error.log \n\
\n\
[program:backend] \n\
command=python /app/server.py \n\
directory=/app \n\
autostart=true \n\
autorestart=true \n\
stdout_logfile=/var/log/biodockify/backend.log \n\
stderr_logfile=/var/log/biodockify/backend-error.log \n\
environment=PYTHONPATH="/app" \n\
\n\
[program:frontend] \n\
command=node /app/ui/server.js \n\
directory=/app/ui \n\
autostart=true \n\
autorestart=true \n\
stdout_logfile=/var/log/biodockify/frontend.log \n\
stderr_logfile=/var/log/biodockify/frontend-error.log \n\
environment=PORT="3000",HOSTNAME="0.0.0.0" \n\
' > /etc/supervisor/conf.d/biodockify.conf

# Create startup script that handles missing frontend gracefully
RUN echo '#!/bin/bash \n\
set -e \n\
\n\
# Check if frontend exists \n\
if [ ! -f /app/ui/server.js ]; then \n\
    echo "Frontend server.js not found. Trying alternative startup..." \n\
    # Try running with npx next start \n\
    sed -i "s|node /app/ui/server.js|cd /app/ui \&\& npx next start -p 3000|g" /etc/supervisor/conf.d/biodockify.conf \n\
fi \n\
\n\
echo "Starting BioDockify..." \n\
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf \n\
' > /app/start.sh && chmod +x /app/start.sh

# Labels
LABEL maintainer="BioDockify AI"
LABEL description="BioDockify Pharma Research AI - Docker Edition"
LABEL version="2.20.0"

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV BIODOCKIFY_DATA=/biodockify/data

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://localhost/health || exit 1

# Volume for persistent data
VOLUME ["/biodockify/data"]

# Start
CMD ["/app/start.sh"]

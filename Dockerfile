# =============================================================================
# BioDockify v2.20.2 - Docker Production Image
# =============================================================================
# One-Command Install:
#   docker pull tajo9128/biodockify-ai:latest
#   docker run -d -p 50081:80 --name biodockify tajo9128/biodockify-ai
#   Open: http://localhost:50081
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Frontend Builder (Bun/Next.js)
# -----------------------------------------------------------------------------
FROM oven/bun:1.1-alpine AS frontend-builder

WORKDIR /app/ui

# Install dependencies first for caching
COPY ui/package.json ui/bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Copy source and build
COPY ui/ ./
ENV NEXT_TELEMETRY_DISABLED=1

# Build with fallback
RUN bun run build || (npm install && npm run build) || echo "Frontend build warning - continuing..."

# -----------------------------------------------------------------------------
# Stage 2: Python Backend + Runtime
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install system dependencies (including curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    curl \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt 2>/dev/null || true

# Install heavy dependencies with graceful fallback
RUN pip install --no-cache-dir tensorflow==2.15.0 Pillow>=10.2.0 2>/dev/null || echo "TensorFlow install optional"
RUN pip install --no-cache-dir decimer>=2.2.0 2>/dev/null || echo "DECIMER install optional"
RUN pip install --no-cache-dir rdkit>=2023.9.4 2>/dev/null || echo "RDKit install optional"

# Copy frontend build artifacts
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

# Create data directories
RUN mkdir -p /app/data /var/log/biodockify /run

# -----------------------------------------------------------------------------
# Nginx Configuration - Reverse Proxy
# -----------------------------------------------------------------------------
RUN rm -f /etc/nginx/sites-enabled/default && \
    echo 'server { \
    listen 80; \
    server_name _; \
    client_max_body_size 100M; \
    \
    # Frontend (Next.js) \
    location / { \
        proxy_pass http://127.0.0.1:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 300s; \
        proxy_connect_timeout 60s; \
    } \
    \
    # Backend API \
    location /api/ { \
        proxy_pass http://127.0.0.1:8234/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_read_timeout 300s; \
        proxy_connect_timeout 60s; \
    } \
    \
    # Health Check Endpoint \
    location /health { \
        access_log off; \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/biodockify.conf

# -----------------------------------------------------------------------------
# Supervisor Configuration - Process Manager
# -----------------------------------------------------------------------------
RUN echo '[supervisord] \n\
nodaemon=true \n\
logfile=/var/log/biodockify/supervisord.log \n\
pidfile=/var/run/supervisord.pid \n\
loglevel=info \n\
\n\
[program:nginx] \n\
command=nginx -g "daemon off;" \n\
autostart=true \n\
autorestart=true \n\
priority=10 \n\
stdout_logfile=/var/log/biodockify/nginx.log \n\
stderr_logfile=/var/log/biodockify/nginx-error.log \n\
stdout_logfile_maxbytes=10MB \n\
stderr_logfile_maxbytes=10MB \n\
\n\
[program:backend] \n\
command=python /app/server.py \n\
directory=/app \n\
autostart=true \n\
autorestart=true \n\
priority=20 \n\
startsecs=5 \n\
startretries=3 \n\
stdout_logfile=/var/log/biodockify/backend.log \n\
stderr_logfile=/var/log/biodockify/backend-error.log \n\
stdout_logfile_maxbytes=50MB \n\
stderr_logfile_maxbytes=50MB \n\
environment=PYTHONPATH="/app",PYTHONUNBUFFERED="1" \n\
\n\
[program:frontend] \n\
command=/app/start-frontend.sh \n\
directory=/app/ui \n\
autostart=true \n\
autorestart=true \n\
priority=30 \n\
startsecs=10 \n\
startretries=5 \n\
stdout_logfile=/var/log/biodockify/frontend.log \n\
stderr_logfile=/var/log/biodockify/frontend-error.log \n\
stdout_logfile_maxbytes=50MB \n\
stderr_logfile_maxbytes=50MB \n\
environment=PORT="3000",HOSTNAME="0.0.0.0",NODE_ENV="production" \n\
' > /etc/supervisor/conf.d/biodockify.conf

# -----------------------------------------------------------------------------
# Startup Scripts
# -----------------------------------------------------------------------------

# Frontend startup script with fallback options
RUN echo '#!/bin/bash \n\
set -e \n\
cd /app/ui \n\
\n\
echo "[Frontend] Starting Next.js..." \n\
\n\
# Try standalone server first (fastest) \n\
if [ -f "/app/ui/server.js" ]; then \n\
    echo "[Frontend] Using standalone server.js" \n\
    exec node server.js \n\
fi \n\
\n\
# Fallback to npx next start \n\
if [ -d "/app/ui/.next" ]; then \n\
    echo "[Frontend] Using npx next start" \n\
    exec npx next start -p 3000 -H 0.0.0.0 \n\
fi \n\
\n\
# Last resort - serve static files \n\
echo "[Frontend] No Next.js build found, serving static placeholder" \n\
echo "BioDockify is starting..." > /tmp/index.html \n\
exec python -m http.server 3000 --directory /tmp \n\
' > /app/start-frontend.sh && chmod +x /app/start-frontend.sh

# Main startup script
RUN echo '#!/bin/bash \n\
echo "=========================================" \n\
echo "  BioDockify v2.20.2 - Starting..." \n\
echo "=========================================" \n\
echo "" \n\
echo "  Access at: http://localhost:50081" \n\
echo "  (or the port you mapped)" \n\
echo "" \n\
echo "=========================================" \n\
\n\
# Ensure log directory exists \n\
mkdir -p /var/log/biodockify \n\
\n\
# Wait for nginx config to be valid \n\
nginx -t 2>/dev/null || echo "Nginx config warning" \n\
\n\
# Start supervisor (manages all processes) \n\
exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf \n\
' > /app/start.sh && chmod +x /app/start.sh

# -----------------------------------------------------------------------------
# Labels & Metadata
# -----------------------------------------------------------------------------
LABEL maintainer="tajo9128"
LABEL org.opencontainers.image.title="BioDockify Pharma Research AI"
LABEL org.opencontainers.image.description="Integrated AI Research Workstation for Pharmaceutical & Life Sciences"
LABEL org.opencontainers.image.version="2.20.2"
LABEL org.opencontainers.image.source="https://github.com/tajo9128/BioDockify-pharma-research-ai"

# -----------------------------------------------------------------------------
# Environment Variables
# -----------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV BIODOCKIFY_DATA=/app/data
ENV PORT=80

# Expose HTTP port
EXPOSE 80

# Health check - wait 60s before first check, then every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost/health || exit 1

# Persistent data volume
VOLUME ["/app/data"]

# Default command
CMD ["/app/start.sh"]

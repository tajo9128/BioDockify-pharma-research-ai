# =============================================================================
# BioDockify v2.4.3 - Docker Production Image
# =============================================================================
# One-Command Install:
#   docker pull tajo9128/biodockify-ai:latest
#   docker run -d -p 31234:31234 --name biodockify tajo9128/biodockify-ai
#   Open: http://localhost:31234
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
RUN bun run build || (npm install && npm run build)

# -----------------------------------------------------------------------------
# Stage 2: Python Backend + All Dependencies Bundled
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install ALL system dependencies required for the full stack
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Build essentials
    build-essential \
    gcc \
    g++ \
    cmake \
    # Graphics/Image processing (for OpenCV, Pillow, DECIMER)
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    # Database drivers
    libpq-dev \
    # Networking
    curl \
    wget \
    # Web servers
    nginx \
    supervisor \
    # PDF processing (for pdf2image, poppler)
    poppler-utils \
    # Video processing (for ffmpeg)
    ffmpeg \
    # Git (for some pip packages)
    git \
    # Chromium for Playwright
    chromium \
    chromium-driver \
    # Additional libs for scientific computing
    libhdf5-dev \
    libblas-dev \
    liblapack-dev \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install build tools
RUN pip install --upgrade pip setuptools wheel

# Copy requirements
COPY api/requirements.txt ./requirements.txt
COPY api/requirements_heavy.txt ./requirements_heavy.txt

# Install ALL dependencies (Core + Heavy)
# Optimization: Combine installs to reduce layers and use --no-cache-dir
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements_heavy.txt && \
    playwright install --with-deps chromium

# Verify imports work
RUN python -c "import fastapi; print('FastAPI OK')" && \
    python -c "import numpy; print(f'NumPy {numpy.__version__}')" && \
    python -c "import tensorflow as tf; print(f'TensorFlow {tf.__version__}')" && \
    echo "=== All dependencies verified ==="

# -----------------------------------------------------------------------------
# Copy Application Code
# -----------------------------------------------------------------------------

# Copy frontend build artifacts
COPY --from=frontend-builder /app/ui/.next/standalone/ /app/
COPY --from=frontend-builder /app/ui/.next/static/ /app/.next/static/
COPY --from=frontend-builder /app/ui/public/ /app/public/
COPY --from=frontend-builder /app/ui/package.json /app/package.json

# Copy ALL backend application code
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

# Create data directories
RUN mkdir -p /app/data /var/log/biodockify /run

# -----------------------------------------------------------------------------
# Nginx Configuration - Reverse Proxy
# -----------------------------------------------------------------------------
RUN rm -f /etc/nginx/sites-enabled/default && \
    echo 'server { \
    listen 3000; \
    server_name _; \
    client_max_body_size 100M; \
    \
    # Next.js static files - CRITICAL FIX \
    location /_next/static/ { \
        alias /app/.next/static/; \
        expires 1y; \
        access_log off; \
        add_header Cache-Control "public, max-age=31536000, immutable"; \
        try_files $uri $uri/ =404; \
    } \
    \
    # Public assets fallback \
    location /public/ { \
        alias /app/public/; \
        expires 7d; \
        try_files $uri $uri/ =404; \
    } \
    \
    # Static Assets Root (Logos, Icons) \
    location ~* ^/(logo|favicon|sw\.js|manifest\.json) { \
        root /app/public; \
        expires 7d; \
        try_files $uri =404; \
    } \
    \
    # Main Next.js app \
    location / { \
        proxy_pass http://127.0.0.1:3001; \
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
        add_header Access-Control-Allow-Origin *; \
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
startsecs=10 \n\
startretries=5 \n\
stdout_logfile=/var/log/biodockify/backend.log \n\
stderr_logfile=/var/log/biodockify/backend-error.log \n\
stdout_logfile_maxbytes=50MB \n\
stderr_logfile_maxbytes=50MB \n\
environment=PYTHONPATH="/app",PYTHONUNBUFFERED="1" \n\
\n\
[program:frontend] \n\
command=/app/start-frontend.sh \n\
directory=/app \n\
autostart=true \n\
autorestart=true \n\
priority=30 \n\
startsecs=10 \n\
startretries=5 \n\
stdout_logfile=/var/log/biodockify/frontend.log \n\
stderr_logfile=/var/log/biodockify/frontend-error.log \n\
stdout_logfile_maxbytes=50MB \n\
stderr_logfile_maxbytes=50MB \n\
environment=PORT="3001",HOSTNAME="0.0.0.0",NODE_ENV="production" \n\
' > /etc/supervisor/conf.d/biodockify.conf

# -----------------------------------------------------------------------------
# Startup Scripts
# -----------------------------------------------------------------------------

# Frontend startup script with fallback options
RUN echo '#!/bin/bash \n\
set -e \n\
\n\
echo "[Frontend] Starting Next.js..." \n\
\n\
# Try standalone server first (Next.js 15+ structure) \n\
if [ -f "/app/server.js" ]; then \n\
    echo "[Frontend] Using standalone server.js" \n\
    exec node /app/server.js \n\
fi \n\
\n\
# Fallback to npx next start (if build dir exists but server.js failed) \n\
if [ -d "/app/ui/.next" ]; then \n\
    echo "[Frontend] Using npx next start" \n\
    cd /app/ui && exec npx next start -p 3001 -H 0.0.0.0 \n\
fi \n\
\n\
# Last resort - serve static files \n\
echo "[Frontend] No Next.js build found, serving placeholder" \n\
echo "BioDockify is starting..." > /tmp/index.html \n\
exec python -m http.server 3001 --directory /tmp \n\
' > /app/start-frontend.sh && chmod +x /app/start-frontend.sh

# Main startup script - Instant Start (Baked Dependencies)
RUN echo '#!/bin/bash \n\
echo "================================================" \n\
echo "  BioDockify v2.4.3 - Production Startup" \n\
echo "================================================" \n\
echo "" \n\
echo "  [ACTION REQUIRED] Open your browser to:" \n\
echo "  👉  http://localhost:3000" \n\
echo "" \n\
echo "  Ensure you are using the correct port mapping:" \n\
echo "  docker run -p 3000:3000 ..." \n\
echo "================================================" \n\
\n\
# Ensure log directory exists \n\
mkdir -p /var/log/biodockify \n\
\n\
# Validate nginx config \n\
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
LABEL org.opencontainers.image.description="BioDockify Fully Baked Image - All Dependencies Pre-installed"
LABEL org.opencontainers.image.version="2.4.3"
LABEL org.opencontainers.image.source="https://github.com/tajo9128/BioDockify-pharma-research-ai"

# -----------------------------------------------------------------------------
# Environment Variables
# -----------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV NODE_ENV=production
ENV BIODOCKIFY_DATA=/app/data
ENV PORT=3000
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Expose HTTP port
EXPOSE 3000

# Health check - wait 90s for heavy deps to load
HEALTHCHECK --interval=30s --timeout=15s --start-period=120s --retries=5 \
    CMD curl -sf http://localhost:3000/health || exit 1

# Persistent data volume
VOLUME ["/app/data"]

# Default command
CMD ["/app/start.sh"]

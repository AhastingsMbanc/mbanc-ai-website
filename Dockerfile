# ═══════════════════════════════════════════════════
#  mbanc.ai Dashboard — Multi-stage Docker Build
# ═══════════════════════════════════════════════════
#  Stage 1: Build React/Vite frontend
#  Stage 2: Production Flask app served by Gunicorn
# ═══════════════════════════════════════════════════

# ── Stage 1: Frontend Build ──────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build
COPY webapp/frontend/package.json webapp/frontend/package-lock.json* ./
RUN npm ci --production=false 2>/dev/null || npm install

COPY webapp/frontend/ ./
RUN npm run build


# ── Stage 2: Production App ──────────────────────────
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend files
COPY app.py .
COPY config/ ./config/

# Copy built frontend
COPY --from=frontend-build /build/dist/ /app/static_dist/

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5070

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:5070/api/health || exit 1

# Set frontend dist path for Flask
ENV FRONTEND_DIST=/app/static_dist

CMD ["gunicorn", "--bind", "0.0.0.0:5070", "--workers", "2", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app:app"]

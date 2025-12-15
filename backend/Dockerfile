# HistoryBuff Backend Dockerfile
#
# Multi-stage build for smaller production image
# Includes sentence-transformers for local embeddings

# ===========================================
# STAGE 1: Builder
# ===========================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ===========================================
# STAGE 2: Production
# ===========================================
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
# - tesseract for OCR
# - curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-grc \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
USER app

# Copy wheels from builder and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir --user /wheels/*

# Add local bin to PATH
ENV PATH="/home/app/.local/bin:$PATH"

# Copy application code
COPY --chown=app:app . .

# Pre-download embedding model (so it's cached in image)
# This runs at build time, not runtime
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Expose port
EXPOSE 8000

# Default command (overridden by docker-compose for workers)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

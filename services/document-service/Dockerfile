# ==============================================================================
# DOCDRAFT AI — DOCUMENT PROCESSING MICROSERVICE (FASTAPI)
# Target: Python 3.11 with Headless Chromium & Vietnamese Typography Support
# ==============================================================================

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000

WORKDIR /app

# Install system dependencies, Chromium, and Vietnamese font packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    chromium \
    chromium-driver \
    && fc-cache -f -v \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose microservice internal port
EXPOSE 8000

# Docker Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start Uvicorn ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

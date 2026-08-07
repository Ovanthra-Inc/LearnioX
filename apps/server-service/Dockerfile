FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOME=/app


RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# LOW (Security): Run as a non-root user inside the container
# This limits the blast radius of any container escape vulnerability.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8000

# HIGH-14 + MED-10: Use gunicorn with UvicornWorker for multi-process / graceful shutdown.
# --workers: number of worker processes (auto-scales with CPU cores via $(nproc))
# --timeout: graceful shutdown timeout in seconds (allows in-flight requests to drain)
# --graceful-timeout: time to wait for workers to finish their current request on SIGTERM
# --keep-alive: HTTP keep-alive timeout
CMD ["sh", "-c", "gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers ${GUNICORN_WORKERS:-2} \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile -"]

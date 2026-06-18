# SnapFlow — Dockerfile for HuggingFace Spaces
# Base: Python 3.10 slim
# Arsitektur: FastAPI serve React build sebagai static files
# Port: 7860 (wajib untuk HuggingFace Spaces)

FROM python:3.10-slim

# ── System dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Working directory ─────────────────────────────────────────────────────────
WORKDIR /app

# ── Copy requirements dan install dulu (layer cache) ─────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ── Copy seluruh project ──────────────────────────────────────────────────────
COPY . .

# ── Buat folder model/saved_model jika belum ada ─────────────────────────────
# Model akan di-download otomatis saat startup via model_downloader.py
RUN mkdir -p model/saved_model

# ── Environment variables default ────────────────────────────────────────────
# GROQ_API_KEY harus di-set sebagai HuggingFace Space Secret
ENV MODEL_PATH=/app/model/saved_model
ENV APP_HOST=0.0.0.0
ENV APP_PORT=7860
ENV DEBUG=False
ENV DATABASE_URL=sqlite:///./snapflow.db

# ── Expose port 7860 (wajib HuggingFace Spaces) ──────────────────────────────
EXPOSE 7860

# ── Jalankan FastAPI dari folder backend ─────────────────────────────────────
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]

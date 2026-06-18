---
title: SnapFlow AI Workplace Assistant
emoji: 📄
colorFrom: yellow
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI untuk otomasi pengelolaan dokumen internal perusahaan
---

# SnapFlow — AI Workplace Assistant

> Sistem AI untuk otomasi pengelolaan dokumen internal perusahaan

**Program:** Pijak in collaboration with IBM SkillsBuild — Capstone Project 2026  
**Tim:** PJK-GM102 | **Tema:** AI for Productivity and Automation

---

## Deskripsi

SnapFlow adalah sistem berbasis AI yang mengotomasi pengelolaan dokumen internal
perusahaan secara end-to-end — klasifikasi, prioritasi, perangkuman, routing,
hingga tanya jawab berbasis konten dokumen (RAG). Sistem ini menyelesaikan
masalah sortir manual dokumen yang memakan 2–3 jam/hari dan rawan human error.

---

## Fitur

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | Klasifikasi Otomatis | Deteksi 5 kategori dokumen menggunakan IndoBERT fine-tuned |
| 2 | Prediksi Prioritas | Prediksi tingkat prioritas (Tinggi / Sedang / Rendah) |
| 3 | Auto Summarizer | Ringkasan 3–5 poin penting via Groq LLaMA 3 |
| 4 | Routing Recommendation | Rekomendasi divisi penerima dokumen |
| 5 | Meeting Summarizer | Ekstrak keputusan, action items, dan peserta rapat |
| 6 | Document Q&A (RAG) | Tanya jawab berbasis isi dokumen via FAISS + LangChain |
| 7 | Statistics Dashboard | Visualisasi distribusi kategori, prioritas, dan routing |
| 8 | History Log | Riwayat seluruh dokumen dan meeting yang diproses |
| 9 | Model Comparison | Perbandingan performa IndoBERT vs SVM + TF-IDF |

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| ML Model Utama | IndoBERT fine-tuned (`indobenchmark/indobert-base-p1`) |
| ML Baseline | SVM + TF-IDF |
| LLM | Groq API (LLaMA 3) |
| RAG Pipeline | FAISS + LangChain + sentence-transformers |
| Backend | FastAPI + Uvicorn (Python 3.10) |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Database | SQLite |
| Deployment | HuggingFace Spaces (Docker SDK) |

---

## Cara Menjalankan (Login Demo)

| Email | Password | Role |
|-------|----------|------|
| `admin@snapflow.id` | `snapflow2024` | Admin |

Atau gunakan tombol **Masuk sebagai Tamu** untuk akses tanpa login.

---

## Struktur Repository

```
SnapFlow/
├── backend/
│   ├── main.py              # FastAPI entry point (semua endpoint di /api/*)
│   ├── auth.py              # Session-based authentication
│   ├── classifier.py        # IndoBERT & SVM classifier wrapper
│   ├── summarizer.py        # Groq LLaMA 3 document summarizer
│   ├── meeting.py           # Meeting summarizer
│   ├── rag.py               # RAG pipeline (FAISS + LangChain)
│   ├── routing.py           # Routing recommendation engine
│   ├── database.py          # SQLite manager
│   └── model_downloader.py  # Auto-download model dari Google Drive
├── data/
│   ├── raw/                 # Dataset mentah (JSON per kategori)
│   └── processed/           # dataset_clean.csv + split train/val/test
├── model/
│   ├── training_model.py    # Script training (Google Colab)
│   └── saved_model/         # Model tersimpan (auto-download saat startup)
├── notebooks/
│   └── Training_Model.ipynb # Notebook Colab fine-tuning IndoBERT
├── frontend/
│   ├── src/                 # React source (TypeScript + Vite)
│   └── dist/                # React build (di-serve FastAPI)
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

---

## Dataset

- **Total data bersih:** 1.006 sampel (synthetic, di-generate via AI prompt)
- **Split:** Train / Val / Test — 80% / 10% / 10%
- **Kategori:** Tiket IT, Email HR, Laporan Keuangan, SOP, Permintaan Pengadaan
- **Label prioritas:** Tinggi / Sedang / Rendah
- **Sumber:** Synthetic dataset, di-generate via AI prompt engineering

---

## Instalasi Lokal

### Prasyarat

- Python 3.10.11
- Node.js 18+ dan npm
- Akun [Groq](https://console.groq.com) (gratis) untuk API key

### Setup

```bash
# Clone repo
git clone https://huggingface.co/spaces/AryaCoba/SnapFlow
cd SnapFlow

# Backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Copy dan isi .env
cp .env.example .env
# Edit .env: isi GROQ_API_KEY

# Frontend (opsional — dist/ sudah ada)
cd frontend
npm install
npm run build
```

### Menjalankan

```bash
# Terminal 1 — Backend (dari folder backend/)
cd backend
uvicorn main:app --reload --port 7860

# Akses di: http://localhost:7860
# API docs: http://localhost:7860/docs
```

### Dengan Docker

```bash
docker-compose up --build
# Akses di: http://localhost:7860
```

---

## API Endpoints

Semua endpoint berada di prefix `/api/`:

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/classify` | Klasifikasi dokumen |
| POST | `/api/summarize` | Ringkasan dokumen |
| POST | `/api/meeting` | Meeting summarizer |
| POST | `/api/qa/index` | Index dokumen ke RAG |
| POST | `/api/qa/ask` | Tanya jawab dokumen |
| GET | `/api/history/documents` | Riwayat dokumen |
| GET | `/api/history/meetings` | Riwayat meeting |
| GET | `/api/stats` | Statistik dashboard |
| GET | `/api/health` | Health check |

Swagger UI tersedia di: `/docs`

---

## Environment Variables (HuggingFace Secrets)

Set variabel berikut di **Settings → Variables and secrets** pada HuggingFace Space:

| Key | Keterangan |
|-----|-----------|
| `GROQ_API_KEY` | API key dari [console.groq.com](https://console.groq.com) |

---

## Tim PJK-GM102

| Nama | Peran |
|------|-------|
| Arya Choirul Fikri | AI Project Lead & RAG Specialist |
| Muhammad Iqbal Faza | NLP Model Engineer |
| Pradnya Aliya Maharani | AI Integration Engineer |
| Rizqiyah | AI Interface & Deployment Engineer |
| Ardian Gymnastiar | AI Data Specialist & QA |

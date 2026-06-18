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
| Backend | FastAPI (Python 3.10.11) |
| Frontend | Streamlit (multipage) |
| Database | SQLite |
| Deployment | HuggingFace Spaces |

---

## Struktur Repository

```
snapflow/
├── backend/
│   ├── main.py          # FastAPI entry point (14 endpoint)
│   ├── classifier.py    # IndoBERT & SVM classifier
│   ├── summarizer.py    # Groq LLaMA 3 summarizer
│   ├── meeting.py       # Meeting summarizer
│   ├── rag.py           # RAG pipeline (FAISS + LangChain)
│   ├── routing.py       # Routing recommendation
│   └── database.py      # SQLite manager
├── data/
│   ├── raw/             # Dataset mentah (JSON per kategori)
│   ├── processed/       # Dataset bersih + split train/val/test
│   ├── parse_json_to_csv.py
│   └── validate_dataset.py
├── model/
│   ├── train.py
│   ├── evaluate.py
│   └── saved_model/     # Model IndoBERT & SVM tersimpan
├── notebooks/
│   ├── EDA.ipynb
│   └── training.ipynb
├── frontend/
│   ├── app.py           # Streamlit entry point
│   ├── components/
│   │   └── sidebar.py
│   └── pages/
│       ├── 01_Dashboard.py
│       ├── 02_Klasifikasi.py
│       ├── 03_Ringkasan.py
│       ├── 04_Tanya_Jawab.py
│       ├── 05_History.py
│       └── 06_Meeting.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## Dataset

- **Total data bersih:** 1.006 sampel (synthetic, di-generate via AI prompt)
- **Split:** Train 1.867 (augmented) / Val 234 / Test 235
- **Kategori:** Tiket IT, Email HR, Laporan Keuangan, SOP, Permintaan Pengadaan
- **Label prioritas:** Tinggi / Sedang / Rendah
- **Sumber:** Generated via AI prompt engineering (synthetic dataset)

---

## Instalasi & Penggunaan

### Prasyarat

- Python 3.10.11
- Akun [Groq](https://groq.com) (gratis) untuk API key LLaMA 3

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/[username]/SnapFlow.git
cd SnapFlow

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment variables
cp .env.example .env
# Edit .env dan isi nilai berikut:
#   GROQ_API_KEY=your_groq_api_key_here
```

### Menjalankan Aplikasi

```bash
# Terminal 1 — jalankan backend FastAPI
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — jalankan frontend Streamlit
cd frontend
streamlit run app.py
```

Akses aplikasi di: `http://localhost:8501`  
API docs tersedia di: `http://localhost:8000/docs`

### Melatih Ulang Model (Opsional)

```bash
# Jalankan notebook training
jupyter notebook notebooks/training.ipynb

# Atau jalankan script langsung
python model/train.py
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/classify` | Klasifikasi dokumen (kategori + prioritas + routing + summary) |
| POST | `/summarize` | Ringkasan dokumen saja |
| POST | `/meeting` | Meeting summarizer |
| POST | `/qa/index` | Index dokumen ke RAG |
| POST | `/qa/ask` | Tanya jawab dokumen |
| POST | `/qa/reset` | Reset index RAG |
| GET | `/history/documents` | Riwayat dokumen |
| GET | `/history/meetings` | Riwayat meeting |
| GET | `/stats` | Statistik dashboard |
| GET | `/divisions` | Daftar divisi routing |
| GET | `/health` | Health check |

---

## Tim PJK-GM102

| Nama | Peran |
|------|-------|
| Arya Choirul Fikri | AI Project Lead & RAG Specialist |
| Muhammad Iqbal Faza | NLP Model Engineer |
| Pradnya Aliya Maharani | AI Integration Engineer |
| Rizqiyah | AI Interface & Deployment Engineer |
| Ardian Gymnastiar | AI Data Specialist & QA |

---

## Catatan

- File `.env` **tidak** disertakan di repository (berisi API key)
- Gunakan `.env.example` sebagai template konfigurasi
- Model tersimpan di `model/saved_model/` (tidak di-push ke repo karena ukuran besar — gunakan Git LFS atau download dari HuggingFace)
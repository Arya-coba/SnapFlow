cat > README.md << 'EOF'
# SnapFlow — AI Workplace Assistant

> Sistem AI untuk otomasi pengelolaan dokumen internal perusahaan

## Tentang Project
SnapFlow adalah sistem berbasis AI yang mengotomasi pengelolaan dokumen internal 
perusahaan secara end-to-end — klasifikasi, prioritasi, perangkuman, hingga 
tanya jawab berbasis konten dokumen.

## Fitur
- Klasifikasi dokumen otomatis (Tiket IT, Email HR, Laporan Keuangan, SOP, Pengadaan)
- Prediksi prioritas penanganan (Tinggi, Sedang, Rendah)
- Ringkasan otomatis isi dokumen
- Rekomendasi routing ke divisi terkait
- Meeting summarizer otomatis
- Document Q&A berbasis RAG pipeline
- Dashboard statistik & history log
- Perbandingan model SVM vs IndoBERT

## Tech Stack
- **ML Model**: IndoBERT fine-tuned + SVM TF-IDF
- **LLM**: Groq API (LLaMA 3)
- **RAG**: FAISS + LangChain
- **Backend**: FastAPI
- **Frontend**: Streamlit
- **Database**: SQLite
- **Deployment**: HuggingFace Spaces

## Instalasi
```bash
# Clone repository
git clone https://github.com/[username]/SnapFlow.git
cd SnapFlow

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env dan isi API key

# Jalankan backend
uvicorn backend.main:app --reload

# Jalankan frontend (terminal baru)
streamlit run frontend/app.py
```

## Tim
| Nama | Peran |
|------|-------|
| [Anggota 1] | Tech Lead & AI Engineer |
| [Anggota 2] | ML Engineer |
| [Anggota 3] | Backend Developer |
| [Anggota 4] | Frontend Developer |
| [Anggota 5] | Data & Documentation |

## Program
Pijak in collaboration with IBM SkillsBuild — Capstone Project 2026
EOF
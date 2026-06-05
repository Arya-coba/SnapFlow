# backend/main.py
# SnapFlow — AI Workplace Assistant
# FastAPI — Entry point & semua endpoint REST API

import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

# Import semua modul backend
from classifier import get_classifier
from summarizer import summarize_document
from meeting   import summarize_meeting, format_meeting_output
from rag       import get_rag_pipeline
from routing   import get_routing, get_all_divisions
from database  import get_db

load_dotenv()

# ── Init FastAPI ──────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "SnapFlow API",
    description = "AI Workplace Assistant — REST API untuk pengelolaan dokumen internal",
    version     = "1.0.0"
)

# ── CORS — agar Streamlit bisa akses API ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Load models saat startup ──────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("\n🚀 SnapFlow API starting up...")
    classifier = get_classifier()
    print("✅ Semua model siap!")


# ══════════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ══════════════════════════════════════════════════════════════════════════════
class TextRequest(BaseModel):
    teks     : str
    filename : Optional[str] = None

class ClassifyRequest(BaseModel):
    teks      : str
    filename  : Optional[str] = None
    use_model : Optional[str] = "indobert"  # "indobert" atau "svm"
    compare   : Optional[bool] = False       # True = bandingkan kedua model

class QARequest(BaseModel):
    question : str

class IndexRequest(BaseModel):
    teks     : str
    doc_id   : Optional[str] = "doc"


# ══════════════════════════════════════════════════════════════════════════════
# ROOT
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/")
def root():
    return {
        "app"    : "SnapFlow — AI Workplace Assistant",
        "version": "1.0.0",
        "status" : "running",
        "endpoints": [
            "/classify",
            "/summarize",
            "/meeting",
            "/qa/index",
            "/qa/ask",
            "/qa/reset",
            "/history/documents",
            "/history/meetings",
            "/stats",
            "/divisions"
        ]
    }

@app.get("/health")
def health():
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 1 — CLASSIFY
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/classify")
def classify_document(req: ClassifyRequest):
    """
    Klasifikasi dokumen — kategori, prioritas, routing, summary.

    Body:
        teks      : isi dokumen
        filename  : nama file (opsional)
        use_model : "indobert" atau "svm" (default: indobert)
        compare   : True untuk bandingkan kedua model (default: False)
    """
    if not req.teks or not req.teks.strip():
        raise HTTPException(status_code=400, detail="Teks dokumen tidak boleh kosong.")

    classifier = get_classifier()
    db         = get_db()

    # ── Klasifikasi ───────────────────────────────────────────────────────────
    if req.compare:
        # Bandingkan kedua model
        result = classifier.compare(req.teks)
        if not result["success"]:
            raise HTTPException(status_code=500, detail="Gagal mengklasifikasi dokumen.")

        bert_data = result["indobert"]["data"] if result["indobert"]["success"] else {}
        svm_data  = result["svm"]["data"]      if result["svm"]["success"]      else {}

        # Gunakan hasil IndoBERT sebagai data utama
        main_data = bert_data if bert_data else svm_data

    else:
        result    = classifier.classify(req.teks, use_model=req.use_model)
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Gagal mengklasifikasi."))
        main_data = result["data"]
        svm_data  = None

    # ── Routing ───────────────────────────────────────────────────────────────
    routing = get_routing(
        kategori  = main_data.get("kategori", ""),
        prioritas = main_data.get("prioritas", "Sedang")
    )

    # ── Summarize ─────────────────────────────────────────────────────────────
    summary_result = summarize_document(req.teks)
    summary        = summary_result["summary"] if summary_result["success"] else []

    # ── Simpan ke database ────────────────────────────────────────────────────
    db.save_document(
        teks           = req.teks,
        kategori       = main_data.get("kategori", ""),
        prioritas      = main_data.get("prioritas", ""),
        confidence_kat = main_data.get("confidence_kategori", 0),
        confidence_pri = main_data.get("confidence_prioritas", 0),
        routing        = routing,
        summary        = summary,
        model_used     = main_data.get("model", req.use_model),
        filename       = req.filename,
        svm_result     = {"success": True, "data": svm_data} if svm_data else None
    )

    # ── Response ──────────────────────────────────────────────────────────────
    response = {
        "success"  : True,
        "kategori" : main_data.get("kategori"),
        "prioritas": main_data.get("prioritas"),
        "confidence_kategori" : main_data.get("confidence_kategori"),
        "confidence_prioritas": main_data.get("confidence_prioritas"),
        "proba_kategori"      : main_data.get("proba_kategori", {}),
        "proba_prioritas"     : main_data.get("proba_prioritas", {}),
        "routing"  : routing,
        "summary"  : summary,
        "model"    : main_data.get("model")
    }

    # Tambahkan data perbandingan jika diminta
    if req.compare and svm_data:
        response["comparison"] = {
            "indobert" : bert_data,
            "svm"      : svm_data,
            "agreement": result.get("agreement", False)
        }

    return response


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 2 — SUMMARIZE
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/summarize")
def summarize(req: TextRequest):
    """
    Rangkum dokumen menjadi 3-5 poin penting.

    Body:
        teks     : isi dokumen
        filename : nama file (opsional)
    """
    if not req.teks or not req.teks.strip():
        raise HTTPException(status_code=400, detail="Teks dokumen tidak boleh kosong.")

    result = summarize_document(req.teks)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Gagal merangkum."))

    return {
        "success": True,
        "summary": result["summary"],
        "raw"    : result["raw"]
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 3 — MEETING SUMMARIZER
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/meeting")
def meeting_summarizer(req: TextRequest):
    """
    Analisis transkrip/catatan meeting → output terstruktur.

    Body:
        teks     : transkrip atau catatan meeting
        filename : nama file (opsional)
    """
    if not req.teks or not req.teks.strip():
        raise HTTPException(status_code=400, detail="Transkrip meeting tidak boleh kosong.")

    result = summarize_meeting(req.teks)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Gagal menganalisis meeting."))

    # Simpan ke database
    db = get_db()
    db.save_meeting(
        teks     = req.teks,
        data     = result["data"],
        filename = req.filename
    )

    return {
        "success"  : True,
        "data"     : result["data"],
        "formatted": format_meeting_output(result["data"])
    }


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 4 — DOCUMENT Q&A (RAG)
# ══════════════════════════════════════════════════════════════════════════════
@app.post("/qa/index")
def index_document(req: IndexRequest):
    """
    Index dokumen ke FAISS vector store untuk Q&A.

    Body:
        teks   : isi dokumen yang akan di-index
        doc_id : ID dokumen (opsional)
    """
    if not req.teks or not req.teks.strip():
        raise HTTPException(status_code=400, detail="Teks dokumen tidak boleh kosong.")

    rag    = get_rag_pipeline()
    result = rag.index_document(req.teks, doc_id=req.doc_id)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Gagal meng-index dokumen."))

    return {
        "success": True,
        "chunks" : result["chunks"],
        "message": f"Dokumen berhasil di-index dalam {result['chunks']} chunks."
    }


@app.post("/qa/ask")
def ask_question(req: QARequest):
    """
    Tanya jawab berbasis konten dokumen yang sudah di-index.

    Body:
        question : pertanyaan dari user
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    rag    = get_rag_pipeline()
    result = rag.answer_question(req.question)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Gagal menjawab pertanyaan."))

    return {
        "success"      : True,
        "answer"       : result["answer"],
        "source_chunks": result["source_chunks"]
    }


@app.post("/qa/reset")
def reset_qa():
    """Reset vector store — hapus semua dokumen yang sudah di-index."""
    rag = get_rag_pipeline()
    rag.reset()
    return {"success": True, "message": "Vector store berhasil direset."}


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 5 — HISTORY
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/history/documents")
def get_document_history(
    limit    : int           = 50,
    kategori : Optional[str] = None,
    prioritas: Optional[str] = None
):
    """
    Ambil history dokumen yang pernah diproses.

    Query params:
        limit    : jumlah maksimal data (default: 50)
        kategori : filter kategori (opsional)
        prioritas: filter prioritas (opsional)
    """
    db     = get_db()
    result = db.get_documents(limit=limit, kategori=kategori, prioritas=prioritas)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))

    return result


@app.get("/history/documents/{doc_id}")
def get_document_detail(doc_id: int):
    """Ambil detail satu dokumen berdasarkan ID."""
    db     = get_db()
    result = db.get_document_by_id(doc_id)

    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("error"))

    return result


@app.delete("/history/documents/{doc_id}")
def delete_document(doc_id: int):
    """Hapus dokumen dari history."""
    db     = get_db()
    result = db.delete_document(doc_id)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))

    return {"success": True, "message": f"Dokumen ID {doc_id} berhasil dihapus."}


@app.get("/history/meetings")
def get_meeting_history(limit: int = 50):
    """Ambil history meeting yang pernah diproses."""
    db     = get_db()
    result = db.get_meetings(limit=limit)

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))

    return result


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 6 — STATISTIK (Dashboard)
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/stats")
def get_stats():
    """
    Ambil statistik untuk ditampilkan di dashboard.
    Mencakup distribusi kategori, prioritas, routing, dan perbandingan model.
    """
    db     = get_db()
    result = db.get_stats()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))

    return result


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT 7 — DIVISIONS (Info routing)
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/divisions")
def list_divisions():
    """Ambil daftar semua divisi yang terdaftar dalam routing rules."""
    return {
        "success"  : True,
        "divisions": get_all_divisions()
    }


# ── Run langsung ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host    = os.getenv("APP_HOST", "0.0.0.0"),
        port    = int(os.getenv("APP_PORT", 8000)),
        reload  = True
    )
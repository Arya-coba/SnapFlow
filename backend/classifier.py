# backend/classifier.py
# SnapFlow — AI Workplace Assistant
# Document Classifier — Klasifikasi kategori & prioritas dokumen
# Menggunakan IndoBERT fine-tuned (main) + SVM TF-IDF (baseline)

import os
import pickle
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from dotenv import load_dotenv

load_dotenv()

# ── Auto-download model jika belum ada (untuk HuggingFace Spaces / fresh clone) ──
try:
    from model_downloader import ensure_models_downloaded
    ensure_models_downloaded()
except ImportError:
    pass  # Skip jika file belum ada (development lokal dengan model manual)

# ── Konstanta ─────────────────────────────────────────────────────────────────
MODEL_PATH   = os.getenv("MODEL_PATH", "model/saved_model")
MODEL_NAME   = os.getenv("MODEL_NAME", "indobenchmark/indobert-base-p1")
MAX_LENGTH   = 256
DEVICE       = "cuda" if torch.cuda.is_available() else "cpu"

# Label mapping
KATEGORI_LABELS = [
    "Email HR",
    "Laporan Keuangan",
    "Permintaan Pengadaan",
    "SOP",
    "Tiket IT"
]

PRIORITAS_LABELS = [
    "Rendah",
    "Sedang",
    "Tinggi"
]


# ══════════════════════════════════════════════════════════════════════════════
# IndoBERT Classifier
# ══════════════════════════════════════════════════════════════════════════════
class IndoBERTClassifier:
    """
    Classifier berbasis IndoBERT fine-tuned.
    Digunakan sebagai model utama (main model) SnapFlow.

    Membutuhkan model yang sudah di-fine-tune oleh Anggota 2
    dan disimpan di folder model/saved_model/
    """

    def __init__(self):
        self.tokenizer        = None
        self.model_kategori   = None
        self.model_prioritas  = None
        self.is_loaded        = False


    def load(self) -> dict:
        """
        Load model IndoBERT dari disk.

        Returns:
            dict: { "success": bool, "error": str | None }
        """
        try:
            kategori_path  = os.path.join(MODEL_PATH, "kategori", "model_kategori")
            prioritas_path = os.path.join(MODEL_PATH, "prioritas", "model_prioritas")

            # Cek apakah model sudah ada
            if not os.path.exists(kategori_path):
                return {
                    "success": False,
                    "error": f"Model kategori tidak ditemukan di: {kategori_path}\n"
                             f"Pastikan Anggota 2 sudah menjalankan training dan menyimpan model."
                }
            if not os.path.exists(prioritas_path):
                return {
                    "success": False,
                    "error": f"Model prioritas tidak ditemukan di: {prioritas_path}\n"
                             f"Pastikan Anggota 2 sudah menjalankan training dan menyimpan model."
                }

            print("🔄 Loading IndoBERT tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(kategori_path)

            print("🔄 Loading model kategori...")
            self.model_kategori = AutoModelForSequenceClassification.from_pretrained(
                kategori_path
            ).to(DEVICE)
            self.model_kategori.eval()

            print("🔄 Loading model prioritas...")
            self.model_prioritas = AutoModelForSequenceClassification.from_pretrained(
                prioritas_path
            ).to(DEVICE)
            self.model_prioritas.eval()

            self.is_loaded = True
            print(f"✅ IndoBERT loaded! (device: {DEVICE})")
            return {"success": True, "error": None}

        except Exception as e:
            return {"success": False, "error": f"Gagal load IndoBERT: {str(e)}"}


    def predict(self, text: str) -> dict:
        """
        Prediksi kategori dan prioritas dokumen menggunakan IndoBERT.

        Args:
            text (str): Teks dokumen

        Returns:
            dict: {
                "kategori"           : str,
                "prioritas"          : str,
                "confidence_kategori": float,
                "confidence_prioritas: float,
                "proba_kategori"     : dict,
                "proba_prioritas"    : dict,
                "model"              : "IndoBERT"
            }
        """
        if not self.is_loaded:
            raise RuntimeError("Model belum di-load. Panggil load() dulu.")

        # Tokenisasi
        inputs = self.tokenizer(
            text.strip(),
            return_tensors="pt",
            truncation=True,
            max_length=MAX_LENGTH,
            padding=True
        )
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

        with torch.no_grad():
            # Prediksi kategori
            out_kat   = self.model_kategori(**inputs)
            proba_kat = torch.softmax(out_kat.logits, dim=-1)[0].cpu().numpy()
            idx_kat   = int(np.argmax(proba_kat))

            # Prediksi prioritas
            out_pri   = self.model_prioritas(**inputs)
            proba_pri = torch.softmax(out_pri.logits, dim=-1)[0].cpu().numpy()
            idx_pri   = int(np.argmax(proba_pri))

        return {
            "kategori"            : KATEGORI_LABELS[idx_kat],
            "prioritas"           : PRIORITAS_LABELS[idx_pri],
            "confidence_kategori" : round(float(proba_kat[idx_kat]) * 100, 2),
            "confidence_prioritas": round(float(proba_pri[idx_pri]) * 100, 2),
            "proba_kategori"      : {
                label: round(float(p) * 100, 2)
                for label, p in zip(KATEGORI_LABELS, proba_kat)
            },
            "proba_prioritas"     : {
                label: round(float(p) * 100, 2)
                for label, p in zip(PRIORITAS_LABELS, proba_pri)
            },
            "model": "IndoBERT"
        }


# ══════════════════════════════════════════════════════════════════════════════
# SVM + TF-IDF Classifier (Baseline)
# ══════════════════════════════════════════════════════════════════════════════
class SVMClassifier:
    """
    Classifier berbasis SVM + TF-IDF.
    Digunakan sebagai baseline model untuk perbandingan dengan IndoBERT.

    Model ini lebih ringan dan cepat, tapi akurasi lebih rendah
    dibanding IndoBERT karena tidak memahami konteks kalimat.
    """

    def __init__(self):
        self.vectorizer_kat   = None
        self.vectorizer_pri   = None
        self.model_kategori   = None
        self.model_prioritas  = None
        self.is_loaded        = False


    def load(self) -> dict:
        """Load model SVM dari disk."""
        try:
            svm_path = os.path.join(MODEL_PATH, "svm", "model_svm")

            if not os.path.exists(svm_path):
                return {
                    "success": False,
                    "error": f"Model SVM tidak ditemukan di: {svm_path}"
                }

            with open(os.path.join(svm_path, "vectorizer_kategori.pkl"), "rb") as f:
                self.vectorizer_kat = pickle.load(f)
            with open(os.path.join(svm_path, "vectorizer_prioritas.pkl"), "rb") as f:
                self.vectorizer_pri = pickle.load(f)
            with open(os.path.join(svm_path, "svm_kategori.pkl"), "rb") as f:
                self.model_kategori = pickle.load(f)
            with open(os.path.join(svm_path, "svm_prioritas.pkl"), "rb") as f:
                self.model_prioritas = pickle.load(f)

            self.is_loaded = True
            print("✅ SVM + TF-IDF loaded!")
            return {"success": True, "error": None}

        except Exception as e:
            return {"success": False, "error": f"Gagal load SVM: {str(e)}"}


    def predict(self, text: str) -> dict:
        """
        Prediksi kategori dan prioritas dokumen menggunakan SVM + TF-IDF.

        Args:
            text (str): Teks dokumen

        Returns:
            dict: hasil prediksi (format sama dengan IndoBERTClassifier.predict())
        """
        if not self.is_loaded:
            raise RuntimeError("Model belum di-load. Panggil load() dulu.")

        text = text.strip()

        # Prediksi kategori
        x_kat       = self.vectorizer_kat.transform([text])
        pred_kat    = self.model_kategori.predict(x_kat)[0]
        proba_kat   = self.model_kategori.predict_proba(x_kat)[0]
        idx_kat     = list(self.model_kategori.classes_).index(pred_kat)

        # Prediksi prioritas
        x_pri       = self.vectorizer_pri.transform([text])
        pred_pri    = self.model_prioritas.predict(x_pri)[0]
        proba_pri   = self.model_prioritas.predict_proba(x_pri)[0]
        idx_pri     = list(self.model_prioritas.classes_).index(pred_pri)

        return {
            "kategori"            : pred_kat,
            "prioritas"           : pred_pri,
            "confidence_kategori" : round(float(proba_kat[idx_kat]) * 100, 2),
            "confidence_prioritas": round(float(proba_pri[idx_pri]) * 100, 2),
            "proba_kategori"      : {
                label: round(float(p) * 100, 2)
                for label, p in zip(self.model_kategori.classes_, proba_kat)
            },
            "proba_prioritas"     : {
                label: round(float(p) * 100, 2)
                for label, p in zip(self.model_prioritas.classes_, proba_pri)
            },
            "model": "SVM + TF-IDF"
        }


# ══════════════════════════════════════════════════════════════════════════════
# DocumentClassifier — Wrapper utama
# ══════════════════════════════════════════════════════════════════════════════
class DocumentClassifier:
    """
    Wrapper utama yang menggabungkan IndoBERT dan SVM.
    Ini yang dipanggil oleh FastAPI dan Streamlit.

    Fitur:
    - Prediksi pakai IndoBERT (main)
    - Prediksi pakai SVM (baseline)
    - Perbandingan kedua model sekaligus
    """

    def __init__(self):
        self.indobert = IndoBERTClassifier()
        self.svm      = SVMClassifier()


    def load_models(self) -> dict:
        """Load kedua model sekaligus."""
        results = {}

        print("\n📦 Loading models...\n")

        # Load IndoBERT
        result_bert = self.indobert.load()
        results["indobert"] = result_bert
        if not result_bert["success"]:
            print(f"⚠️  IndoBERT: {result_bert['error']}")

        # Load SVM
        result_svm = self.svm.load()
        results["svm"] = result_svm
        if not result_svm["success"]:
            print(f"⚠️  SVM: {result_svm['error']}")

        return results


    def classify(self, text: str, use_model: str = "indobert") -> dict:
        """
        Klasifikasi dokumen menggunakan model yang dipilih.

        Args:
            text      (str): Teks dokumen
            use_model (str): "indobert" atau "svm"

        Returns:
            dict: hasil prediksi
        """
        if not text or not text.strip():
            return {
                "success": False,
                "error"  : "Teks dokumen kosong.",
                "data"   : None
            }

        try:
            if use_model == "indobert":
                if not self.indobert.is_loaded:
                    return {
                        "success": False,
                        "error"  : "Model IndoBERT belum di-load.",
                        "data"   : None
                    }
                result = self.indobert.predict(text)

            elif use_model == "svm":
                if not self.svm.is_loaded:
                    return {
                        "success": False,
                        "error"  : "Model SVM belum di-load.",
                        "data"   : None
                    }
                result = self.svm.predict(text)

            else:
                return {
                    "success": False,
                    "error"  : f"Model tidak dikenali: {use_model}. Pilih 'indobert' atau 'svm'.",
                    "data"   : None
                }

            return {"success": True, "error": None, "data": result}

        except Exception as e:
            return {
                "success": False,
                "error"  : f"Gagal mengklasifikasi dokumen: {str(e)}",
                "data"   : None
            }


    def compare(self, text: str) -> dict:
        """
        Jalankan kedua model dan bandingkan hasilnya.
        Dipakai untuk fitur Model Comparison di dashboard.

        Args:
            text (str): Teks dokumen

        Returns:
            dict: {
                "success"  : bool,
                "indobert" : dict hasil IndoBERT,
                "svm"      : dict hasil SVM,
                "agreement": bool (apakah kedua model sepakat?)
            }
        """
        if not text or not text.strip():
            return {"success": False, "error": "Teks dokumen kosong."}

        result_bert = self.classify(text, use_model="indobert")
        result_svm  = self.classify(text, use_model="svm")

        # Cek apakah kedua model sepakat
        agreement = False
        if result_bert["success"] and result_svm["success"]:
            agreement = (
                result_bert["data"]["kategori"] == result_svm["data"]["kategori"] and
                result_bert["data"]["prioritas"] == result_svm["data"]["prioritas"]
            )

        return {
            "success"  : result_bert["success"] or result_svm["success"],
            "indobert" : result_bert,
            "svm"      : result_svm,
            "agreement": agreement,
            "error"    : None
        }


# ── Singleton instance ────────────────────────────────────────────────────────
_classifier_instance = None

def get_classifier() -> DocumentClassifier:
    """
    Return singleton instance DocumentClassifier.
    Dipakai sebagai dependency injection di FastAPI.
    """
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = DocumentClassifier()
        _classifier_instance.load_models()
    return _classifier_instance


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_docs = [
        {
            "label": "Tiket IT - Tinggi",
            "teks" : "Kepada Tim IT, laptop saya tiba-tiba tidak bisa menyala sejak tadi pagi. "
                     "Saya memiliki presentasi penting kepada klien dalam 2 jam ke depan dan "
                     "semua file presentasi ada di laptop tersebut. Mohon bantuan segera."
        },
        {
            "label": "Email HR - Sedang",
            "teks" : "Yth. Tim HRD, saya ingin mengajukan permohonan cuti tahunan selama 3 hari "
                     "pada tanggal 20-22 Mei 2026 untuk keperluan keluarga. Saya sudah "
                     "berkoordinasi dengan atasan langsung dan pekerjaan saya sudah "
                     "didelegasikan kepada rekan satu tim."
        },
        {
            "label": "Laporan Keuangan - Tinggi",
            "teks" : "Kepada Yth. Direktur Keuangan, bersama ini kami sampaikan laporan "
                     "keuangan bulan April 2026. Terdapat selisih anggaran sebesar "
                     "Rp 45.000.000 yang perlu segera dikonfirmasi sebelum penutupan "
                     "buku akhir bulan besok."
        },
        {
            "label": "SOP - Rendah",
            "teks" : "SOP Penggunaan Ruang Rapat: Seluruh karyawan yang ingin menggunakan "
                     "ruang rapat wajib melakukan pemesanan minimal 1 hari sebelumnya "
                     "melalui sistem booking online. Ruang rapat harus dikembalikan dalam "
                     "kondisi bersih dan rapi setelah digunakan."
        },
        {
            "label": "Permintaan Pengadaan - Sedang",
            "teks" : "Kepada Tim Procurement, kami dari Divisi Marketing membutuhkan "
                     "pengadaan 10 unit laptop untuk kebutuhan tim yang baru bergabung. "
                     "Spesifikasi minimal: RAM 16GB, SSD 512GB, processor Intel i5 gen 12. "
                     "Estimasi anggaran Rp 80.000.000. Mohon dapat diproses bulan ini."
        }
    ]

    print("=" * 60)
    print("TEST: Document Classifier (SnapFlow)")
    print("=" * 60)
    print("⚠️  Catatan: Test ini membutuhkan model yang sudah di-train.")
    print("   Jika model belum ada, output akan menunjukkan error load.")
    print("=" * 60)

    classifier = DocumentClassifier()
    load_results = classifier.load_models()

    bert_ok = load_results["indobert"]["success"]
    svm_ok  = load_results["svm"]["success"]

    if not bert_ok and not svm_ok:
        print("\n❌ Kedua model belum tersedia.")
        print("   Jalankan training dulu (model/train.py) sebelum test ini.")
    else:
        for doc in test_docs:
            print(f"\n📄 {doc['label']}")
            print(f"   Teks: {doc['teks'][:80]}...")

            if bert_ok:
                hasil = classifier.classify(doc["teks"], use_model="indobert")
                if hasil["success"]:
                    d = hasil["data"]
                    print(f"\n   🤖 IndoBERT:")
                    print(f"      Kategori  : {d['kategori']} ({d['confidence_kategori']}%)")
                    print(f"      Prioritas : {d['prioritas']} ({d['confidence_prioritas']}%)")

            if svm_ok:
                hasil = classifier.classify(doc["teks"], use_model="svm")
                if hasil["success"]:
                    d = hasil["data"]
                    print(f"\n   📊 SVM + TF-IDF:")
                    print(f"      Kategori  : {d['kategori']} ({d['confidence_kategori']}%)")
                    print(f"      Prioritas : {d['prioritas']} ({d['confidence_prioritas']}%)")

            if bert_ok and svm_ok:
                compare = classifier.compare(doc["teks"])
                agreement = "✅ Sepakat" if compare["agreement"] else "⚠️ Berbeda"
                print(f"\n   Kedua model: {agreement}")
            print()
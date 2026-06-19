# backend/model_downloader.py
# SnapFlow — AI Workplace Assistant
# Auto-download model dari HuggingFace Hub saat model tidak ada di lokal.
# Dipanggil oleh classifier.py sebelum load model.

import os
import zipfile
import shutil

# ── Konfigurasi HuggingFace Hub ───────────────────────────────────────────────
# Repo: https://huggingface.co/AryaCoba/snapflow-models
HF_REPO_ID  = "AryaCoba/snapflow-models"
HF_REPO_TYPE = "model"

MODEL_FILES = [
    "indobert_kategori.zip",
    "indobert_prioritas.zip",
    "svm.zip",
]

# Path tujuan — harus sama dengan MODEL_PATH di classifier.py dan .env
MODEL_PATH = os.getenv("MODEL_PATH", "model/saved_model")


def _is_model_ready() -> bool:
    """Cek apakah semua model sudah ada di lokal."""
    indobert_kat_ok = os.path.isdir(os.path.join(MODEL_PATH, "indobert_kategori"))
    indobert_pri_ok = os.path.isdir(os.path.join(MODEL_PATH, "indobert_prioritas"))
    svm_dir         = os.path.join(MODEL_PATH, "svm")
    svm_dir_ok      = os.path.isdir(svm_dir)

    if svm_dir_ok:
        required_pkl = [
            "vectorizer_kategori.pkl",
            "vectorizer_prioritas.pkl",
            "svm_kategori.pkl",
            "svm_prioritas.pkl",
        ]
        svm_files_ok = all(
            os.path.exists(os.path.join(svm_dir, f)) for f in required_pkl
        )
    else:
        svm_files_ok = False

    return indobert_kat_ok and indobert_pri_ok and svm_files_ok


def _download_from_hf(filename: str, dest_path: str) -> bool:
    """Download satu file dari HuggingFace Hub."""
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("❌ huggingface_hub belum terinstall. Jalankan: pip install huggingface_hub")
        return False

    print(f"   ⬇️  Downloading {filename} dari HuggingFace Hub...")
    try:
        downloaded = hf_hub_download(
            repo_id   = HF_REPO_ID,
            filename  = filename,
            repo_type = HF_REPO_TYPE,
            local_dir = os.path.dirname(dest_path),
        )
        # hf_hub_download menyimpan ke cache, kita rename ke dest_path
        if downloaded != dest_path:
            shutil.copy2(downloaded, dest_path)
        return os.path.exists(dest_path)
    except Exception as e:
        print(f"   ❌ Gagal download {filename}: {e}")
        return False


def _extract_zip(zip_path: str, extract_to: str):
    """Ekstrak zip ke folder tujuan."""
    print(f"   📦 Mengekstrak {os.path.basename(zip_path)}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)
    os.remove(zip_path)


def ensure_models_downloaded() -> bool:
    """
    Pastikan semua model tersedia di lokal.
    Download otomatis dari HuggingFace Hub jika belum ada.

    Returns:
        bool: True jika semua model siap, False jika gagal.
    """
    if _is_model_ready():
        print("✅ Model sudah ada di lokal, skip download.")
        return True

    print(f"\n🔽 Model belum ada di lokal. Download dari HuggingFace Hub ({HF_REPO_ID})...\n")
    os.makedirs(MODEL_PATH, exist_ok=True)

    tmp_dir = os.path.join(MODEL_PATH, "_tmp")
    os.makedirs(tmp_dir, exist_ok=True)

    success = True

    for filename in MODEL_FILES:
        zip_path = os.path.join(tmp_dir, filename)

        ok = _download_from_hf(filename, zip_path)
        if not ok:
            print(f"   ❌ Gagal download {filename}")
            success = False
            continue

        _extract_zip(zip_path, MODEL_PATH)
        print(f"   ✅ {filename} berhasil diekstrak.")

    shutil.rmtree(tmp_dir, ignore_errors=True)

    if success and _is_model_ready():
        print("\n✅ Semua model berhasil didownload dan siap digunakan!\n")
        return True
    else:
        print(
            "\n❌ Beberapa model gagal didownload.\n"
            f"   Pastikan repo {HF_REPO_ID} publik dan berisi file zip model.\n"
        )
        return False


if __name__ == "__main__":
    result = ensure_models_downloaded()
    print("Model ready:", result)

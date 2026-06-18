# backend/model_downloader.py
# SnapFlow — AI Workplace Assistant
# Auto-download model dari Google Drive saat model tidak ada di lokal.
# Dipanggil oleh classifier.py sebelum load model.

import os
import zipfile
import shutil

# ── ID folder/file Google Drive (ambil dari URL drive kamu) ──────────────────
# URL folder: https://drive.google.com/drive/folders/1rcJdteHW2fe1tzUPGCX22kOwplaq3HKW
# Untuk download via gdown, kita butuh ID file per file (bukan folder).
#
# CARA CARI FILE ID:
#   1. Buka Google Drive → klik kanan file → "Get link"
#   2. URL: https://drive.google.com/file/d/FILE_ID_DI_SINI/view
#   3. Salin FILE_ID dan paste di dict GDRIVE_FILES di bawah
#
# STRUKTUR YANG DIHARAPKAN DI GOOGLE DRIVE:
#   indobert_kategori.zip   → berisi folder model HuggingFace (config.json, pytorch_model.bin, dll)
#   indobert_prioritas.zip  → sama
#   svm.zip                 → berisi 4 file .pkl (vectorizer + model)

GDRIVE_FILES = {
    # Ganti nilai di bawah dengan File ID yang kamu copy dari Google Drive
    "indobert_kategori.zip" : "1DDjNZA7aSQz0BRfQ_rMKPy28vY94lTkM",
    "indobert_prioritas.zip": "1FiJHZYTY5SPdu7EfbaEnR9oYRfSBPGbX",
    "svm.zip"               : "11JLzbWCA14a4CJifJ1SH3-pUDzk7p457",
}

# Path tujuan (harus sama dengan MODEL_PATH di classifier.py)
MODEL_PATH = os.getenv("MODEL_PATH", "model/saved_model")


def _is_model_ready() -> bool:
    """Cek apakah semua model sudah ada di lokal."""
    kategori_ok  = os.path.isdir(os.path.join(MODEL_PATH, "kategori"))
    prioritas_ok = os.path.isdir(os.path.join(MODEL_PATH, "prioritas"))
    svm_ok       = os.path.isdir(os.path.join(MODEL_PATH, "svm"))
    return kategori_ok and prioritas_ok and svm_ok


def _download_file(file_id: str, dest_path: str) -> bool:
    """Download satu file dari Google Drive via gdown."""
    try:
        import gdown
    except ImportError:
        print("❌ gdown belum terinstall. Jalankan: pip install gdown")
        return False

    url = f"https://drive.google.com/uc?id={file_id}"
    print(f"   ⬇️  Downloading {os.path.basename(dest_path)}...")
    try:
        gdown.download(url, dest_path, quiet=False)
        return os.path.exists(dest_path)
    except Exception as e:
        print(f"   ❌ Gagal download: {e}")
        return False


def _extract_zip(zip_path: str, extract_to: str):
    """Ekstrak zip ke folder tujuan."""
    print(f"   📦 Ekstrak {os.path.basename(zip_path)}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)
    os.remove(zip_path)  # Hapus zip setelah ekstrak untuk hemat disk


def ensure_models_downloaded() -> bool:
    """
    Pastikan semua model tersedia di lokal.
    Kalau belum ada, download dari Google Drive.

    Returns:
        bool: True jika semua model siap, False jika gagal.
    
    Cara pakai di classifier.py:
        from model_downloader import ensure_models_downloaded
        ensure_models_downloaded()
    """
    if _is_model_ready():
        print("✅ Model sudah ada di lokal, skip download.")
        return True

    # Validasi: pastikan File ID sudah diisi
    placeholder = "GANTI_DENGAN_FILE_ID"
    if any(placeholder in fid for fid in GDRIVE_FILES.values()):
        print(
            "⚠️  File ID Google Drive belum diisi di model_downloader.py.\n"
            "   Edit GDRIVE_FILES dan isi dengan ID file dari Google Drive kamu.\n"
            "   Cara cari ID: klik kanan file di Drive → 'Get link' → salin ID dari URL."
        )
        return False

    print("\n🔽 Model belum ada di lokal. Mulai download dari Google Drive...\n")
    os.makedirs(MODEL_PATH, exist_ok=True)

    # Temporary folder untuk zip
    tmp_dir = os.path.join(MODEL_PATH, "_tmp")
    os.makedirs(tmp_dir, exist_ok=True)

    success = True

    for filename, file_id in GDRIVE_FILES.items():
        zip_path = os.path.join(tmp_dir, filename)

        # Download
        ok = _download_file(file_id, zip_path)
        if not ok:
            print(f"   ❌ Gagal download {filename}")
            success = False
            continue

        # Tentukan folder tujuan ekstrak
        if "kategori" in filename:
            dest = os.path.join(MODEL_PATH, "kategori")
        elif "prioritas" in filename:
            dest = os.path.join(MODEL_PATH, "prioritas")
        elif "svm" in filename:
            dest = os.path.join(MODEL_PATH, "svm")
        else:
            dest = MODEL_PATH

        os.makedirs(dest, exist_ok=True)
        _extract_zip(zip_path, dest)
        print(f"   ✅ {filename} siap.")

    # Bersihkan tmp
    shutil.rmtree(tmp_dir, ignore_errors=True)

    if success and _is_model_ready():
        print("\n✅ Semua model berhasil didownload dan siap digunakan!\n")
        return True
    else:
        print("\n❌ Beberapa model gagal didownload. Cek koneksi atau File ID.\n")
        return False


if __name__ == "__main__":
    # Test langsung: python backend/model_downloader.py
    result = ensure_models_downloaded()
    print("Model ready:", result)
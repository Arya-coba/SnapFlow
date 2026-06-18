# backend/model_downloader.py
# SnapFlow — AI Workplace Assistant
# Auto-download model dari Google Drive saat model tidak ada di lokal.
# Dipanggil oleh classifier.py sebelum load model.

import os
import zipfile
import shutil

# ── ID file Google Drive ──────────────────────────────────────────────────────
# Cara cari File ID:
#   1. Buka Google Drive → klik kanan file zip → "Get link" → atur ke "Anyone with link"
#   2. URL: https://drive.google.com/file/d/FILE_ID_INI/view
#   3. Salin FILE_ID dan paste di dict GDRIVE_FILES di bawah
#
# Zip dibuat otomatis di akhir training_model.py (bagian "Buat ZIP").
# Struktur zip yang dihasilkan training_model.py:
#   indobert_kategori.zip  → mengandung folder indobert_kategori/ di dalamnya
#   indobert_prioritas.zip → mengandung folder indobert_prioritas/ di dalamnya
#   svm.zip                → mengandung folder svm/ dengan 4 file .pkl
#
# Setelah extract ke MODEL_PATH, hasilnya:
#   model/saved_model/
#   ├── indobert_kategori/    ← dibaca classifier.py
#   ├── indobert_prioritas/   ← dibaca classifier.py
#   └── svm/                  ← dibaca classifier.py (4 file pkl di dalamnya)

GDRIVE_FILES = {
    # Update File ID di bawah setelah zip di-upload ulang dari training_model.py
    "indobert_kategori.zip" : "1t3lPCopYSx6IhcP0DXLQ7Y7HFTGm7Imo",
    "indobert_prioritas.zip": "1vFnnt5H3JMRz4fPVODz0hqkllIjjY4uq",
    "svm.zip"               : "1JzUYlE6bT1ym9cktjCKEkyOkMm4RYxI7",
}

# Path tujuan — harus sama dengan MODEL_PATH di classifier.py dan .env
MODEL_PATH = os.getenv("MODEL_PATH", "model/saved_model")


def _is_model_ready() -> bool:
    """
    Cek apakah semua model sudah ada di lokal.
    Path harus sesuai dengan output training_model.py dan yang dibaca classifier.py.
    """
    indobert_kat_ok = os.path.isdir(os.path.join(MODEL_PATH, "indobert_kategori"))
    indobert_pri_ok = os.path.isdir(os.path.join(MODEL_PATH, "indobert_prioritas"))
    svm_dir         = os.path.join(MODEL_PATH, "svm")
    svm_dir_ok      = os.path.isdir(svm_dir)

    # Cek juga 4 file pkl wajib ada di dalam folder svm/
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
    """
    Ekstrak zip langsung ke extract_to.

    Zip dari training_model.py sudah mengandung nama folder di dalamnya,
    sehingga cukup extract ke MODEL_PATH untuk menghasilkan struktur yang benar.

    Contoh:
        indobert_kategori.zip diekstrak ke model/saved_model/
        → menghasilkan model/saved_model/indobert_kategori/...
    """
    print(f"   📦 Mengekstrak {os.path.basename(zip_path)}...")
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_to)
    os.remove(zip_path)  # Hapus zip setelah ekstrak untuk hemat disk


def ensure_models_downloaded() -> bool:
    """
    Pastikan semua model tersedia di lokal.
    Kalau belum ada, download otomatis dari Google Drive.

    Returns:
        bool: True jika semua model siap, False jika gagal.

    Dipanggil dari classifier.py saat startup:
        from model_downloader import ensure_models_downloaded
        ensure_models_downloaded()
    """
    if _is_model_ready():
        print("✅ Model sudah ada di lokal, skip download.")
        return True

    # Validasi: pastikan File ID bukan placeholder
    placeholder = "GANTI_DENGAN_FILE_ID"
    if any(placeholder in fid for fid in GDRIVE_FILES.values()):
        print(
            "⚠️  File ID Google Drive belum diisi di model_downloader.py.\n"
            "   Edit GDRIVE_FILES dan isi dengan ID dari URL Google Drive.\n"
            "   Cara: klik kanan file zip di Drive → 'Get link' → salin ID dari URL."
        )
        return False

    print("\n🔽 Model belum ada di lokal. Mulai download dari Google Drive...\n")
    os.makedirs(MODEL_PATH, exist_ok=True)

    # Folder sementara untuk menyimpan zip sebelum diekstrak
    tmp_dir = os.path.join(MODEL_PATH, "_tmp")
    os.makedirs(tmp_dir, exist_ok=True)

    success = True

    for filename, file_id in GDRIVE_FILES.items():
        zip_path = os.path.join(tmp_dir, filename)

        # Download zip dari Drive
        ok = _download_file(file_id, zip_path)
        if not ok:
            print(f"   ❌ Gagal download {filename}")
            success = False
            continue

        # Ekstrak langsung ke MODEL_PATH — struktur folder sudah ada di dalam zip
        _extract_zip(zip_path, MODEL_PATH)
        print(f"   ✅ {filename} berhasil diekstrak.")

    # Bersihkan folder tmp
    shutil.rmtree(tmp_dir, ignore_errors=True)

    if success and _is_model_ready():
        print("\n✅ Semua model berhasil didownload dan siap digunakan!\n")
        return True
    else:
        print(
            "\n❌ Beberapa model gagal atau struktur tidak sesuai.\n"
            "   Cek koneksi internet, File ID di GDRIVE_FILES, dan pastikan\n"
            "   zip dibuat menggunakan training_model.py terbaru.\n"
        )
        return False


if __name__ == "__main__":
    # Test langsung: python backend/model_downloader.py
    result = ensure_models_downloaded()
    print("Model ready:", result)

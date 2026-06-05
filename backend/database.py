# backend/database.py
# SnapFlow — AI Workplace Assistant
# Database handler — SQLite untuk history & statistik dokumen

import os
import sqlite3
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ── Konfigurasi ───────────────────────────────────────────────────────────────
DB_PATH = os.getenv("DATABASE_URL", "snapflow.db").replace("sqlite:///./", "")


# ══════════════════════════════════════════════════════════════════════════════
# Database Manager
# ══════════════════════════════════════════════════════════════════════════════
class DatabaseManager:
    """
    Mengelola semua operasi database SQLite untuk SnapFlow.

    Tabel yang dikelola:
    - documents  : history dokumen yang diproses
    - meetings   : history meeting yang diproses
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()


    # ── Init database ─────────────────────────────────────────────────────────
    def _init_db(self):
        """Buat tabel jika belum ada."""
        with self._connect() as conn:
            cursor = conn.cursor()

            # Tabel documents — history dokumen yang diproses
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at            TEXT    NOT NULL,
                    filename              TEXT,
                    teks_preview          TEXT,
                    kategori              TEXT,
                    prioritas             TEXT,
                    confidence_kategori   REAL,
                    confidence_prioritas  REAL,
                    routing_divisi        TEXT,
                    routing_tim           TEXT,
                    summary               TEXT,
                    model_used            TEXT    DEFAULT 'IndoBERT',
                    svm_kategori          TEXT,
                    svm_prioritas         TEXT,
                    svm_confidence_kat    REAL,
                    svm_confidence_pri    REAL
                )
            """)

            # Tabel meetings — history meeting yang diproses
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS meetings (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at      TEXT    NOT NULL,
                    filename        TEXT,
                    teks_preview    TEXT,
                    ringkasan       TEXT,
                    topik_utama     TEXT,
                    keputusan       TEXT,
                    action_items    TEXT,
                    peserta         TEXT,
                    catatan         TEXT
                )
            """)

            conn.commit()


    # ── Koneksi ───────────────────────────────────────────────────────────────
    def _connect(self):
        """Buat koneksi ke SQLite database."""
        os.makedirs(os.path.dirname(self.db_path) if os.path.dirname(self.db_path) else ".", exist_ok=True)
        return sqlite3.connect(self.db_path)


    # ══════════════════════════════════════════════════════════════════════════
    # DOCUMENTS — Save & Get
    # ══════════════════════════════════════════════════════════════════════════
    def save_document(
        self,
        teks          : str,
        kategori      : str,
        prioritas     : str,
        confidence_kat: float,
        confidence_pri: float,
        routing       : dict,
        summary       : list[str],
        model_used    : str  = "IndoBERT",
        filename      : str  = None,
        svm_result    : dict = None
    ) -> dict:
        """
        Simpan hasil pemrosesan dokumen ke database.

        Args:
            teks           : isi dokumen asli
            kategori       : hasil klasifikasi kategori
            prioritas      : hasil klasifikasi prioritas
            confidence_kat : confidence score kategori (%)
            confidence_pri : confidence score prioritas (%)
            routing        : dict hasil routing recommendation
            summary        : list poin ringkasan dokumen
            model_used     : model yang digunakan ("IndoBERT" / "SVM + TF-IDF")
            filename       : nama file yang diupload (opsional)
            svm_result     : hasil SVM untuk perbandingan (opsional)

        Returns:
            dict: { "success": bool, "id": int, "error": str | None }
        """
        try:
            # Preview teks (max 200 karakter)
            teks_preview = teks.strip()[:200] + "..." if len(teks) > 200 else teks.strip()

            # Konversi summary list ke string JSON
            summary_json = json.dumps(summary, ensure_ascii=False)

            # Data SVM (opsional)
            svm_kat = svm_pri = svm_conf_kat = svm_conf_pri = None
            if svm_result and svm_result.get("success"):
                d = svm_result.get("data", {})
                svm_kat      = d.get("kategori")
                svm_pri      = d.get("prioritas")
                svm_conf_kat = d.get("confidence_kategori")
                svm_conf_pri = d.get("confidence_prioritas")

            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO documents (
                        created_at, filename, teks_preview,
                        kategori, prioritas,
                        confidence_kategori, confidence_prioritas,
                        routing_divisi, routing_tim,
                        summary, model_used,
                        svm_kategori, svm_prioritas,
                        svm_confidence_kat, svm_confidence_pri
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    filename,
                    teks_preview,
                    kategori,
                    prioritas,
                    confidence_kat,
                    confidence_pri,
                    routing.get("divisi", ""),
                    routing.get("tim", ""),
                    summary_json,
                    model_used,
                    svm_kat,
                    svm_pri,
                    svm_conf_kat,
                    svm_conf_pri
                ))
                conn.commit()
                doc_id = cursor.lastrowid

            return {"success": True, "id": doc_id, "error": None}

        except Exception as e:
            return {"success": False, "id": None, "error": str(e)}


    def get_documents(
        self,
        limit     : int  = 50,
        kategori  : str  = None,
        prioritas : str  = None
    ) -> dict:
        """
        Ambil history dokumen dari database.

        Args:
            limit    : jumlah maksimal data yang diambil
            kategori : filter berdasarkan kategori (opsional)
            prioritas: filter berdasarkan prioritas (opsional)

        Returns:
            dict: { "success": bool, "data": list[dict], "total": int }
        """
        try:
            query  = "SELECT * FROM documents"
            params = []
            wheres = []

            if kategori:
                wheres.append("kategori = ?")
                params.append(kategori)
            if prioritas:
                wheres.append("prioritas = ?")
                params.append(prioritas)
            if wheres:
                query += " WHERE " + " AND ".join(wheres)

            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)

            with self._connect() as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()

            # Konversi ke list dict
            data = []
            for row in rows:
                item = dict(row)
                # Parse summary JSON kembali ke list
                try:
                    item["summary"] = json.loads(item["summary"]) if item["summary"] else []
                except Exception:
                    item["summary"] = []
                data.append(item)

            return {"success": True, "data": data, "total": len(data), "error": None}

        except Exception as e:
            return {"success": False, "data": [], "total": 0, "error": str(e)}


    def get_document_by_id(self, doc_id: int) -> dict:
        """Ambil satu dokumen berdasarkan ID."""
        try:
            with self._connect() as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
                row = cursor.fetchone()

            if not row:
                return {"success": False, "data": None, "error": f"Dokumen ID {doc_id} tidak ditemukan."}

            item = dict(row)
            try:
                item["summary"] = json.loads(item["summary"]) if item["summary"] else []
            except Exception:
                item["summary"] = []

            return {"success": True, "data": item, "error": None}

        except Exception as e:
            return {"success": False, "data": None, "error": str(e)}


    def delete_document(self, doc_id: int) -> dict:
        """Hapus dokumen dari history."""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
                conn.commit()
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}


    # ══════════════════════════════════════════════════════════════════════════
    # MEETINGS — Save & Get
    # ══════════════════════════════════════════════════════════════════════════
    def save_meeting(
        self,
        teks    : str,
        data    : dict,
        filename: str = None
    ) -> dict:
        """
        Simpan hasil pemrosesan meeting ke database.

        Args:
            teks    : transkrip/catatan meeting asli
            data    : dict hasil summarize_meeting()["data"]
            filename: nama file yang diupload (opsional)

        Returns:
            dict: { "success": bool, "id": int, "error": str | None }
        """
        try:
            teks_preview = teks.strip()[:200] + "..." if len(teks) > 200 else teks.strip()

            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO meetings (
                        created_at, filename, teks_preview,
                        ringkasan, topik_utama, keputusan,
                        action_items, peserta, catatan
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    filename,
                    teks_preview,
                    data.get("ringkasan", ""),
                    json.dumps(data.get("topik_utama", []), ensure_ascii=False),
                    json.dumps(data.get("keputusan", []), ensure_ascii=False),
                    json.dumps(data.get("action_items", []), ensure_ascii=False),
                    json.dumps(data.get("peserta", []), ensure_ascii=False),
                    data.get("catatan_tambahan", "")
                ))
                conn.commit()
                meeting_id = cursor.lastrowid

            return {"success": True, "id": meeting_id, "error": None}

        except Exception as e:
            return {"success": False, "id": None, "error": str(e)}


    def get_meetings(self, limit: int = 50) -> dict:
        """Ambil history meeting dari database."""
        try:
            with self._connect() as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM meetings ORDER BY created_at DESC LIMIT ?",
                    (limit,)
                )
                rows = cursor.fetchall()

            data = []
            for row in rows:
                item = dict(row)
                for field in ["topik_utama", "keputusan", "action_items", "peserta"]:
                    try:
                        item[field] = json.loads(item[field]) if item[field] else []
                    except Exception:
                        item[field] = []
                data.append(item)

            return {"success": True, "data": data, "total": len(data), "error": None}

        except Exception as e:
            return {"success": False, "data": [], "total": 0, "error": str(e)}


    # ══════════════════════════════════════════════════════════════════════════
    # STATISTIK — untuk Dashboard
    # ══════════════════════════════════════════════════════════════════════════
    def get_stats(self) -> dict:
        """
        Ambil statistik untuk ditampilkan di dashboard.

        Returns:
            dict berisi berbagai statistik dokumen & meeting
        """
        try:
            with self._connect() as conn:
                cursor = conn.cursor()

                # Total dokumen
                cursor.execute("SELECT COUNT(*) FROM documents")
                total_docs = cursor.fetchone()[0]

                # Total meeting
                cursor.execute("SELECT COUNT(*) FROM meetings")
                total_meetings = cursor.fetchone()[0]

                # Distribusi kategori
                cursor.execute("""
                    SELECT kategori, COUNT(*) as count
                    FROM documents
                    GROUP BY kategori
                    ORDER BY count DESC
                """)
                dist_kategori = {row[0]: row[1] for row in cursor.fetchall()}

                # Distribusi prioritas
                cursor.execute("""
                    SELECT prioritas, COUNT(*) as count
                    FROM documents
                    GROUP BY prioritas
                    ORDER BY count DESC
                """)
                dist_prioritas = {row[0]: row[1] for row in cursor.fetchall()}

                # Distribusi routing
                cursor.execute("""
                    SELECT routing_divisi, COUNT(*) as count
                    FROM documents
                    GROUP BY routing_divisi
                    ORDER BY count DESC
                """)
                dist_routing = {row[0]: row[1] for row in cursor.fetchall()}

                # Dokumen per hari (7 hari terakhir)
                cursor.execute("""
                    SELECT DATE(created_at) as tanggal, COUNT(*) as count
                    FROM documents
                    WHERE created_at >= DATE('now', '-7 days')
                    GROUP BY DATE(created_at)
                    ORDER BY tanggal ASC
                """)
                docs_per_hari = {row[0]: row[1] for row in cursor.fetchall()}

                # Rata-rata confidence score
                cursor.execute("""
                    SELECT
                        ROUND(AVG(confidence_kategori), 2),
                        ROUND(AVG(confidence_prioritas), 2)
                    FROM documents
                    WHERE model_used = 'IndoBERT'
                """)
                row = cursor.fetchone()
                avg_conf_kat = row[0] or 0
                avg_conf_pri = row[1] or 0

                # Perbandingan model (agreement rate)
                cursor.execute("""
                    SELECT COUNT(*) FROM documents
                    WHERE svm_kategori IS NOT NULL
                    AND svm_kategori = kategori
                """)
                svm_agree = cursor.fetchone()[0]

                cursor.execute("""
                    SELECT COUNT(*) FROM documents
                    WHERE svm_kategori IS NOT NULL
                """)
                svm_total = cursor.fetchone()[0]

                agreement_rate = round(svm_agree / svm_total * 100, 1) if svm_total > 0 else 0

            return {
                "success"          : True,
                "total_documents"  : total_docs,
                "total_meetings"   : total_meetings,
                "dist_kategori"    : dist_kategori,
                "dist_prioritas"   : dist_prioritas,
                "dist_routing"     : dist_routing,
                "docs_per_hari"    : docs_per_hari,
                "avg_conf_kategori": avg_conf_kat,
                "avg_conf_prioritas": avg_conf_pri,
                "model_agreement"  : agreement_rate,
                "error"            : None
            }

        except Exception as e:
            return {"success": False, "error": str(e)}


    def clear_all(self) -> dict:
        """Hapus semua data (untuk testing)."""
        try:
            with self._connect() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM documents")
                cursor.execute("DELETE FROM meetings")
                conn.commit()
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}


# ── Singleton instance ────────────────────────────────────────────────────────
_db_instance = None

def get_db() -> DatabaseManager:
    """Return singleton instance DatabaseManager."""
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseManager()
    return _db_instance


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os

    # Gunakan DB sementara untuk testing
    TEST_DB = "test_snapflow.db"
    db = DatabaseManager(db_path=TEST_DB)

    print("=" * 60)
    print("TEST: Database Manager (SnapFlow)")
    print("=" * 60)

    # Test save document
    print("\n1. Test save_document...")
    result = db.save_document(
        teks           = "Kepada Tim IT, mohon bantuan reset password email saya. "
                         "Saya tidak bisa login sejak tadi pagi dan ada meeting penting jam 10.",
        kategori       = "Tiket IT",
        prioritas      = "Tinggi",
        confidence_kat = 94.2,
        confidence_pri = 88.7,
        routing        = {"divisi": "Divisi IT", "tim": "Tim Support"},
        summary        = ["Karyawan tidak bisa login email", "Ada meeting penting jam 10", "Butuh reset password segera"],
        model_used     = "IndoBERT",
        filename       = "tiket_001.txt",
        svm_result     = {
            "success": True,
            "data": {
                "kategori"            : "Tiket IT",
                "prioritas"           : "Tinggi",
                "confidence_kategori" : 78.5,
                "confidence_prioritas": 71.2
            }
        }
    )
    print(f"   ✅ Dokumen tersimpan! ID: {result['id']}")

    # Test save meeting
    print("\n2. Test save_meeting...")
    result = db.save_meeting(
        teks     = "Rapat tim membahas progress project SnapFlow minggu ini...",
        filename = "rapat_minggu1.txt",
        data     = {
            "ringkasan"       : "Rapat membahas progress project SnapFlow",
            "topik_utama"     : ["Progress dataset", "Fine-tuning model"],
            "keputusan"       : ["Dataset target 1000 data", "Training mulai minggu depan"],
            "action_items"    : [{"tugas": "Generate dataset", "pic": "Anggota 5", "deadline": "10 Mei"}],
            "peserta"         : ["Anggota 1", "Anggota 2", "Anggota 5"],
            "catatan_tambahan": ""
        }
    )
    print(f"   ✅ Meeting tersimpan! ID: {result['id']}")

    # Test get documents
    print("\n3. Test get_documents...")
    result = db.get_documents(limit=10)
    print(f"   ✅ {result['total']} dokumen ditemukan")
    if result["data"]:
        doc = result["data"][0]
        print(f"   Preview: {doc['teks_preview'][:60]}...")
        print(f"   Kategori: {doc['kategori']} | Prioritas: {doc['prioritas']}")

    # Test get stats
    print("\n4. Test get_stats...")
    stats = db.get_stats()
    if stats["success"]:
        print(f"   ✅ Total dokumen  : {stats['total_documents']}")
        print(f"   ✅ Total meeting  : {stats['total_meetings']}")
        print(f"   ✅ Distribusi     : {stats['dist_kategori']}")
        print(f"   ✅ Agreement rate : {stats['model_agreement']}%")

    # Cleanup test DB
    db.clear_all()
    os.remove(TEST_DB)
    print("\n✅ Semua test selesai! Test DB dihapus.")
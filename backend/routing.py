# backend/routing.py
# SnapFlow — AI Workplace Assistant
# Routing Recommendation — merekomendasikan divisi tujuan berdasarkan kategori dokumen

# ── Routing rules ─────────────────────────────────────────────────────────────
# Struktur: kategori → { divisi, deskripsi, kontak, prioritas_eskalasi }
ROUTING_RULES = {
    "Tiket IT": {
        "divisi": "Divisi IT",
        "tim": "Tim Support & Helpdesk",
        "deskripsi": "Dokumen ini berkaitan dengan permintaan atau masalah teknis yang perlu ditangani oleh tim IT.",
        "kontak": "it-support@perusahaan.com | Ext. 101",
        "eskalasi": {
            "Tinggi": "Langsung hubungi IT Lead — target respons 1 jam",
            "Sedang": "Masukkan ke ticketing system — target respons 4 jam",
            "Rendah": "Masukkan ke ticketing system — target respons 1 hari kerja"
        }
    },
    "Email HR": {
        "divisi": "Divisi Human Resources",
        "tim": "Tim HR & People",
        "deskripsi": "Dokumen ini berkaitan dengan urusan kepegawaian, cuti, reimbursement, atau kebijakan SDM.",
        "kontak": "hr@perusahaan.com | Ext. 102",
        "eskalasi": {
            "Tinggi": "Langsung hubungi HR Manager — target respons 2 jam",
            "Sedang": "Submit ke portal HR — target respons 1 hari kerja",
            "Rendah": "Submit ke portal HR — target respons 3 hari kerja"
        }
    },
    "Laporan Keuangan": {
        "divisi": "Divisi Keuangan & Akuntansi",
        "tim": "Tim Finance",
        "deskripsi": "Dokumen ini berkaitan dengan laporan keuangan, anggaran, invoice, atau transaksi keuangan perusahaan.",
        "kontak": "finance@perusahaan.com | Ext. 103",
        "eskalasi": {
            "Tinggi": "Langsung hubungi CFO / Finance Manager — target respons 2 jam",
            "Sedang": "Kirim ke finance@perusahaan.com — target respons 1 hari kerja",
            "Rendah": "Kirim ke finance@perusahaan.com — target respons 3 hari kerja"
        }
    },
    "SOP": {
        "divisi": "Divisi Operasional",
        "tim": "Tim Quality & Process",
        "deskripsi": "Dokumen ini berkaitan dengan prosedur operasional standar yang perlu ditinjau atau diimplementasikan.",
        "kontak": "operational@perusahaan.com | Ext. 104",
        "eskalasi": {
            "Tinggi": "Koordinasi dengan Department Head terkait — target respons 4 jam",
            "Sedang": "Kirim ke tim Quality — target respons 2 hari kerja",
            "Rendah": "Arsipkan dan review pada siklus review berikutnya"
        }
    },
    "Permintaan Pengadaan": {
        "divisi": "Divisi Procurement",
        "tim": "Tim Pengadaan & Logistik",
        "deskripsi": "Dokumen ini berkaitan dengan permintaan pembelian barang atau jasa yang perlu diproses oleh tim pengadaan.",
        "kontak": "procurement@perusahaan.com | Ext. 105",
        "eskalasi": {
            "Tinggi": "Koordinasi langsung dengan Procurement Manager — target respons 4 jam",
            "Sedang": "Submit form pengadaan — target respons 2 hari kerja",
            "Rendah": "Submit form pengadaan — target respons 5 hari kerja"
        }
    }
}

# Fallback jika kategori tidak dikenali
DEFAULT_ROUTING = {
    "divisi": "Divisi Umum / Sekretariat",
    "tim": "Tim Administrasi",
    "deskripsi": "Kategori dokumen tidak dikenali. Dokumen diteruskan ke bagian administrasi umum untuk ditindaklanjuti.",
    "kontak": "admin@perusahaan.com | Ext. 100",
    "eskalasi": {
        "Tinggi": "Hubungi administrasi segera — target respons 2 jam",
        "Sedang": "Hubungi administrasi — target respons 1 hari kerja",
        "Rendah": "Hubungi administrasi — target respons 3 hari kerja"
    }
}


# ── Main function ─────────────────────────────────────────────────────────────
def get_routing(kategori: str, prioritas: str = "Sedang") -> dict:
    """
    Mendapatkan rekomendasi routing dokumen berdasarkan kategori dan prioritas.

    Args:
        kategori (str): Kategori dokumen hasil klasifikasi
                        ("Tiket IT", "Email HR", "Laporan Keuangan", "SOP", "Permintaan Pengadaan")
        prioritas (str): Tingkat prioritas dokumen ("Tinggi", "Sedang", "Rendah")

    Returns:
        dict: {
            "divisi"      : str,   nama divisi tujuan
            "tim"         : str,   nama tim spesifik
            "deskripsi"   : str,   alasan routing
            "kontak"      : str,   kontak divisi
            "tindak_lanjut": str,  instruksi berdasarkan prioritas
            "kategori"    : str,   kategori input
            "prioritas"   : str,   prioritas input
        }
    """
    # Normalisasi input
    kategori  = kategori.strip() if kategori else ""
    prioritas = prioritas.strip() if prioritas else "Sedang"

    # Validasi prioritas
    if prioritas not in ["Tinggi", "Sedang", "Rendah"]:
        prioritas = "Sedang"

    # Ambil routing rule
    rule = ROUTING_RULES.get(kategori, DEFAULT_ROUTING)

    return {
        "divisi"        : rule["divisi"],
        "tim"           : rule["tim"],
        "deskripsi"     : rule["deskripsi"],
        "kontak"        : rule["kontak"],
        "tindak_lanjut" : rule["eskalasi"].get(prioritas, rule["eskalasi"]["Sedang"]),
        "kategori"      : kategori if kategori else "Tidak dikenali",
        "prioritas"     : prioritas
    }


def get_all_divisions() -> list[dict]:
    """
    Return daftar semua divisi yang terdaftar dalam routing rules.
    Berguna untuk ditampilkan di dashboard Streamlit.
    """
    divisions = []
    for kategori, rule in ROUTING_RULES.items():
        divisions.append({
            "kategori": kategori,
            "divisi"  : rule["divisi"],
            "tim"     : rule["tim"],
            "kontak"  : rule["kontak"]
        })
    return divisions


def format_routing_output(routing: dict) -> str:
    """
    Format dict hasil routing menjadi teks rapi untuk ditampilkan.

    Args:
        routing (dict): Output dari get_routing()

    Returns:
        str: Teks terformat rapi
    """
    output = []
    output.append("📍 REKOMENDASI ROUTING")
    output.append("─" * 50)
    output.append(f"  🏢 Divisi     : {routing['divisi']}")
    output.append(f"  👥 Tim        : {routing['tim']}")
    output.append(f"  📧 Kontak     : {routing['kontak']}")
    output.append(f"  📋 Keterangan : {routing['deskripsi']}")
    output.append("")
    output.append("⚡ TINDAK LANJUT")
    output.append("─" * 50)
    output.append(f"  {routing['tindak_lanjut']}")
    return "\n".join(output)


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("TEST: Routing Recommendation")
    print("=" * 60)

    test_cases = [
        ("Tiket IT", "Tinggi"),
        ("Email HR", "Sedang"),
        ("Laporan Keuangan", "Tinggi"),
        ("SOP", "Rendah"),
        ("Permintaan Pengadaan", "Sedang"),
        ("Kategori Tidak Dikenal", "Tinggi"),   # test fallback
    ]

    for kategori, prioritas in test_cases:
        print(f"\n📄 Kategori : {kategori}")
        print(f"🚨 Prioritas: {prioritas}")
        routing = get_routing(kategori, prioritas)
        print(format_routing_output(routing))
        print()
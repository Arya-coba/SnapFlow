# backend/summarizer.py
# SnapFlow — AI Workplace Assistant
# Auto Document Summarizer menggunakan Groq API (LLaMA 3)

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Init Groq client ──────────────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Konstanta ─────────────────────────────────────────────────────────────────
MODEL         = "llama-3.1-8b-instant"   # model gratis di Groq
MAX_TOKENS    = 1024
TEMPERATURE   = 0.3                # rendah = output lebih konsisten


# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah asisten AI yang bertugas merangkum dokumen internal perusahaan.

Tugasmu adalah menganalisis dokumen yang diberikan dan menghasilkan ringkasan yang:
1. Ditulis dalam Bahasa Indonesia yang jelas dan profesional
2. Terdiri dari 3-5 poin penting saja
3. Setiap poin dimulai dengan "•"
4. Langsung to the point — tidak perlu basa-basi atau penjelasan panjang
5. Fokus pada informasi yang actionable dan penting

Format output HARUS seperti ini (tanpa teks tambahan apapun):
• [poin penting 1]
• [poin penting 2]
• [poin penting 3]
• [poin penting 4 — opsional]
• [poin penting 5 — opsional]"""


# ── Main function ─────────────────────────────────────────────────────────────
def summarize_document(text: str) -> dict:
    """
    Merangkum dokumen teks menjadi 3-5 poin penting.

    Args:
        text (str): Isi dokumen yang akan dirangkum

    Returns:
        dict: {
            "success": bool,
            "summary": list[str],   # list poin-poin ringkasan
            "raw": str,             # raw output dari LLM
            "error": str | None
        }
    """
    # Validasi input
    if not text or not text.strip():
        return {
            "success": False,
            "summary": [],
            "raw": "",
            "error": "Dokumen kosong — tidak ada teks yang bisa dirangkum."
        }

    # Batasi panjang teks agar tidak melebihi context window
    text = text.strip()
    if len(text) > 8000:
        text = text[:8000] + "\n\n[Teks dipotong karena terlalu panjang]"

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Rangkum dokumen berikut:\n\n{text}"
                }
            ]
        )

        raw_output = response.choices[0].message.content.strip()

        # Parse output jadi list poin
        summary_points = _parse_summary(raw_output)

        return {
            "success": True,
            "summary": summary_points,
            "raw": raw_output,
            "error": None
        }

    except Exception as e:
        return {
            "success": False,
            "summary": [],
            "raw": "",
            "error": f"Gagal merangkum dokumen: {str(e)}"
        }


# ── Helper: parse output LLM jadi list ───────────────────────────────────────
def _parse_summary(raw: str) -> list[str]:
    """
    Parse raw output LLM jadi list poin bersih.

    Contoh input:
        "• Karyawan meminta reset password\n• Bersifat urgent"
    Contoh output:
        ["Karyawan meminta reset password", "Bersifat urgent"]
    """
    lines = raw.strip().split("\n")
    points = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Hapus bullet point di awal (•, -, *, 1., 2., dst)
        for prefix in ["•", "-", "*", "·"]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break
        # Hapus numbering (1. 2. dst)
        if len(line) > 2 and line[0].isdigit() and line[1] in [".", ")"]:
            line = line[2:].strip()

        if line:
            points.append(line)

    return points


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Contoh dokumen tiket IT
    contoh_dokumen = """
    Kepada Tim IT,

    Saya ingin melaporkan bahwa laptop saya mengalami kerusakan pada keyboard.
    Beberapa tombol tidak berfungsi dengan baik, terutama tombol huruf 'A', 'S', dan 'D'.
    Hal ini sangat menghambat pekerjaan saya sehari-hari karena saya sering menggunakan
    keyboard untuk mengetik laporan dan email.

    Selain itu, baterai laptop saya juga sudah tidak dapat menyimpan daya dengan baik.
    Laptop hanya bisa bertahan sekitar 30 menit tanpa charger, padahal sebelumnya bisa
    bertahan hingga 4 jam.

    Mohon segera ditindaklanjuti karena saya memiliki presentasi penting kepada klien
    pada hari Jumat minggu ini. Jika memungkinkan, saya membutuhkan laptop pengganti
    sementara selama laptop saya diperbaiki.

    Terima kasih atas perhatiannya.
    Hormat saya,
    Budi Santoso — Divisi Marketing
    """

    print("=" * 60)
    print("TEST: Auto Document Summarizer")
    print("=" * 60)
    print(f"\nInput dokumen:\n{contoh_dokumen}")
    print("\nProses merangkum...")

    hasil = summarize_document(contoh_dokumen)

    if hasil["success"]:
        print("\n✅ Ringkasan berhasil dibuat:\n")
        for i, poin in enumerate(hasil["summary"], 1):
            print(f"  {i}. {poin}")
    else:
        print(f"\n❌ Error: {hasil['error']}")
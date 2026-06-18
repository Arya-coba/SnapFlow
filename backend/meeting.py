# backend/meeting.py
# SnapFlow — AI Workplace Assistant
# Meeting Summarizer — mengubah transkrip/catatan meeting menjadi output terstruktur
 
import os
import json
from groq import Groq
from dotenv import load_dotenv
 
load_dotenv()
 
# ── Init Groq client ──────────────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
 
# ── Konstanta ─────────────────────────────────────────────────────────────────
MODEL       = "llama-3.1-8b-instant"
MAX_TOKENS  = 2048
TEMPERATURE = 0.2   # rendah = output lebih konsisten dan terstruktur
 
 
# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """Kamu adalah asisten AI yang bertugas menganalisis transkrip atau catatan rapat (meeting) perusahaan.
 
Tugasmu adalah mengekstrak informasi penting dari meeting dan menghasilkan output dalam format JSON yang SANGAT KETAT.
 
Output HARUS berupa JSON valid dengan struktur PERSIS seperti ini (tanpa teks tambahan apapun di luar JSON):
{
  "ringkasan": "ringkasan singkat 2-3 kalimat tentang apa yang dibahas dalam meeting",
  "topik_utama": [
    "topik 1 yang dibahas",
    "topik 2 yang dibahas"
  ],
  "keputusan": [
    "keputusan 1 yang diambil dalam meeting",
    "keputusan 2 yang diambil dalam meeting"
  ],
  "action_items": [
    {
      "tugas": "deskripsi tugas yang harus dikerjakan",
      "pic": "nama orang yang bertanggung jawab (tulis 'Tidak disebutkan' jika tidak ada)",
      "deadline": "deadline tugas (tulis 'Tidak disebutkan' jika tidak ada)"
    }
  ],
  "peserta": [
    "nama peserta 1",
    "nama peserta 2"
  ],
  "catatan_tambahan": "informasi penting lainnya yang perlu diperhatikan (kosongkan dengan string kosong jika tidak ada)"
}
 
Aturan penting:
- Tulis semua output dalam Bahasa Indonesia
- Jika informasi tidak tersedia dalam transkrip, tulis "Tidak disebutkan"
- Jangan mengarang informasi yang tidak ada di transkrip
- Output HARUS JSON valid — tidak boleh ada teks di luar JSON"""
 
 
# ── Main function ─────────────────────────────────────────────────────────────
def summarize_meeting(text: str) -> dict:
    """
    Menganalisis transkrip atau catatan meeting dan menghasilkan output terstruktur.
 
    Args:
        text (str): Transkrip atau catatan meeting
 
    Returns:
        dict: {
            "success": bool,
            "data": {
                "ringkasan": str,
                "topik_utama": list[str],
                "keputusan": list[str],
                "action_items": list[dict],
                "peserta": list[str],
                "catatan_tambahan": str
            },
            "raw": str,
            "error": str | None
        }
    """
    # Validasi input
    if not text or not text.strip():
        return {
            "success": False,
            "data": _empty_data(),
            "raw": "",
            "error": "Transkrip meeting kosong — tidak ada teks yang bisa dianalisis."
        }
 
    # Batasi panjang teks
    text = text.strip()
    if len(text) > 12000:
        text = text[:12000] + "\n\n[Transkrip dipotong karena terlalu panjang]"
 
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
                    "content": f"Analisis transkrip meeting berikut dan hasilkan output JSON:\n\n{text}"
                }
            ]
        )
 
        raw_output = response.choices[0].message.content.strip()
 
        # Parse JSON output
        data = _parse_json_output(raw_output)
 
        return {
            "success": True,
            "data": data,
            "raw": raw_output,
            "error": None
        }
 
    except Exception as e:
        return {
            "success": False,
            "data": _empty_data(),
            "raw": "",
            "error": f"Gagal menganalisis meeting: {str(e)}"
        }
 
 
# ── Helper: parse JSON output dari LLM ───────────────────────────────────────
def _parse_json_output(raw: str) -> dict:
    """
    Parse raw output LLM menjadi dict terstruktur.
    Handle kasus di mana LLM menambahkan teks di luar JSON.
    """
    try:
        # Coba parse langsung
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
 
    # Coba ekstrak JSON dari dalam teks
    try:
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        if start != -1 and end > start:
            json_str = raw[start:end]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
 
    # Jika semua gagal, return struktur kosong dengan raw sebagai ringkasan
    return {
        "ringkasan": raw[:500] if raw else "Tidak dapat menganalisis meeting.",
        "topik_utama": [],
        "keputusan": [],
        "action_items": [],
        "peserta": [],
        "catatan_tambahan": "Terjadi kesalahan saat memproses output AI."
    }
 
 
# ── Helper: struktur data kosong ──────────────────────────────────────────────
def _empty_data() -> dict:
    return {
        "ringkasan": "",
        "topik_utama": [],
        "keputusan": [],
        "action_items": [],
        "peserta": [],
        "catatan_tambahan": ""
    }
 
 
# ── Format output untuk ditampilkan ──────────────────────────────────────────
def format_meeting_output(data: dict) -> str:
    """
    Format dict hasil analisis meeting menjadi teks yang rapi untuk ditampilkan.
 
    Args:
        data (dict): Output dari summarize_meeting()["data"]
 
    Returns:
        str: Teks terformat rapi
    """
    output = []
 
    # Ringkasan
    output.append("📋 RINGKASAN MEETING")
    output.append("─" * 50)
    output.append(data.get("ringkasan", "-"))
    output.append("")
 
    # Topik utama
    topik = data.get("topik_utama", [])
    if topik:
        output.append("🗂️ TOPIK YANG DIBAHAS")
        output.append("─" * 50)
        for t in topik:
            output.append(f"  • {t}")
        output.append("")
 
    # Keputusan
    keputusan = data.get("keputusan", [])
    if keputusan:
        output.append("✅ KEPUTUSAN")
        output.append("─" * 50)
        for k in keputusan:
            output.append(f"  • {k}")
        output.append("")
 
    # Action items
    action_items = data.get("action_items", [])
    if action_items:
        output.append("📌 ACTION ITEMS")
        output.append("─" * 50)
        for i, item in enumerate(action_items, 1):
            output.append(f"  {i}. {item.get('tugas', '-')}")
            output.append(f"     👤 PIC      : {item.get('pic', 'Tidak disebutkan')}")
            output.append(f"     📅 Deadline : {item.get('deadline', 'Tidak disebutkan')}")
        output.append("")
 
    # Peserta
    peserta = data.get("peserta", [])
    if peserta:
        output.append("👥 PESERTA")
        output.append("─" * 50)
        output.append("  " + ", ".join(peserta))
        output.append("")
 
    # Catatan tambahan
    catatan = data.get("catatan_tambahan", "")
    if catatan:
        output.append("📝 CATATAN TAMBAHAN")
        output.append("─" * 50)
        output.append(catatan)
 
    return "\n".join(output)
 
 
# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    contoh_transkrip = """
    Rapat Tim Capstone — Selasa, 2 Mei 2026
    Peserta: Budi (Tech Lead), Sari (ML Engineer), Andi (Backend), Dian (Frontend), Rizky (Data)
 
    Budi: Oke teman-teman, kita mulai rapat kickoff project Clario ya.
    Pertama, saya mau recap dulu scope projectnya.
    Kita akan membangun AI Workplace Assistant yang bisa klasifikasi dokumen,
    bikin ringkasan, dan ada fitur meeting summarizer juga.
 
    Sari: Untuk model ML-nya pakai IndoBERT ya? Kapan kita mulai training?
 
    Budi: Iya betul, kita fine-tune IndoBERT. Target akurasi minimal 85%.
    Sari bisa mulai setup Colab minggu ini, kumpulin dataset dulu.
    Deadline dataset adalah tanggal 10 Mei.
 
    Andi: Untuk FastAPI-nya saya mulai dari endpoint classify dulu ya?
 
    Budi: Iya Andi, prioritaskan endpoint classify dan summarize dulu.
    Deadline untuk FastAPI basic endpoints adalah 15 Mei.
 
    Dian: Streamlit UI saya mulai dari halaman upload dokumen dulu kan?
 
    Budi: Betul Dian. Koordinasi sama Andi untuk format response API-nya ya.
    Kalian bikin interface contract dulu sebelum mulai coding.
 
    Rizky: Saya bantu Sari untuk generate dataset ya.
    Kita pakai prompt AI untuk bikin synthetic data.
 
    Budi: Bagus. Jangan lupa semua progress di-update di GitHub Issues setiap hari.
    Daily standup kita jam 20.00 WIB di Discord ya.
 
    Budi: Oke, ada yang mau ditambahkan?
 
    Sari: Tidak ada, sudah jelas semua.
 
    Budi: Oke, rapat selesai. Terima kasih teman-teman!
    """
 
    print("=" * 60)
    print("TEST: Meeting Summarizer")
    print("=" * 60)
    print(f"\nInput transkrip:\n{contoh_transkrip}")
    print("\nProses menganalisis meeting...")
 
    hasil = summarize_meeting(contoh_transkrip)
 
    if hasil["success"]:
        print("\n✅ Analisis meeting berhasil!\n")
        print(format_meeting_output(hasil["data"]))
        print("\n" + "=" * 60)
        print("Raw JSON output:")
        print("=" * 60)
        print(json.dumps(hasil["data"], indent=2, ensure_ascii=False))
    else:
        print(f"\n❌ Error: {hasil['error']}")
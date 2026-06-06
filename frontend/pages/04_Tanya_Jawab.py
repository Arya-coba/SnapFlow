import streamlit as st
import requests
import time

from components.sidebar import show_sidebar
show_sidebar()

API_BASE = "http://localhost:8000"

# ── Helper API ────────────────────────────────────────
def api_qa_index(teks: str, doc_id: str = "doc") -> dict:
    try:
        r = requests.post(f"{API_BASE}/qa/index",
                          json={"teks": teks, "doc_id": doc_id}, timeout=30)
        return r.json() if r.status_code == 200 else {"success": False}
    except:
        return {"success": False, "error": "Backend tidak bisa diakses"}

def api_qa_ask(question: str) -> dict:
    try:
        r = requests.post(f"{API_BASE}/qa/ask",
                          json={"question": question}, timeout=60)
        return r.json() if r.status_code == 200 else {"success": False, "error": "Error"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ── Saran pertanyaan ──────────────────────────────────
SUGGESTIONS = {
    "📄 Apa SOP penanganan server down?":
        "Tolong jelaskan SOP penanganan saat server utama mengalami downtime.",
    "🏢 Siapa kontak Infrastruktur IT?":
        "Siapa yang harus saya hubungi di divisi Infrastruktur IT jika ada kendala?",
    "📝 Ringkas kebijakan cuti HR":
        "Buatkan ringkasan mengenai kebijakan cuti tahunan menurut aturan HR terbaru.",
    "🔴 Alur eskalasi tiket kritis?":
        "Bagaimana alur eskalasi untuk tiket IT dengan prioritas kritis?"
}

# ── Init session state ────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
if "qa_indexed" not in st.session_state:
    st.session_state.qa_indexed = False
if "trigger_question" not in st.session_state:
    st.session_state.trigger_question = None

has_history = len(st.session_state.messages) > 0

# ══════════════════════════════════════════════════════
# MODE 1 — WELCOME SCREEN (belum ada percakapan)
# ══════════════════════════════════════════════════════
if not has_history and not st.session_state.trigger_question:

    st.markdown("""
    <div style='text-align:center; margin-top:40px; margin-bottom:30px;'>
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24"
             fill="none" stroke="#10B981" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962
                     L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0
                     L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964
                     L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                  fill="rgba(16,185,129,0.2)"/>
        </svg>
        <h1 style='margin:10px 0 0; color:#1E293B; font-size:2.8rem;
                   font-weight:700; letter-spacing:-1px;'>
            SnapFlow AI Assistant
        </h1>
        <p style='color:#71717a; font-size:1.1rem; margin-top:5px;'>
            Tanyakan pedoman, SOP, atau dokumen internal perusahaan.
        </p>
    </div>
    """, unsafe_allow_html=True)

    # Input utama
    user_input = st.chat_input("Ketik pertanyaanmu di sini...")
    if user_input:
        st.session_state.trigger_question = user_input
        st.rerun()

    # Tombol saran
    cols = st.columns(len(SUGGESTIONS))
    for i, (label, prompt) in enumerate(SUGGESTIONS.items()):
        with cols[i]:
            if st.button(label, use_container_width=True, key=f"sug_{i}"):
                st.session_state.trigger_question = prompt
                st.rerun()

    st.stop()

# ══════════════════════════════════════════════════════
# MODE 2 — CHAT INTERFACE (sudah ada interaksi)
# ══════════════════════════════════════════════════════

# Header + tombol restart
col_title, col_btn = st.columns([5, 1])
with col_title:
    st.title("SnapFlow AI Assistant", anchor=False)
with col_btn:
    st.write("")
    if st.button("🔄 Restart", use_container_width=True):
        st.session_state.messages        = []
        st.session_state.trigger_question = None
        st.session_state.qa_indexed       = False
        st.rerun()

st.markdown("<hr style='border-color:#e4e4e7; margin:-5px 0 25px;'>",
            unsafe_allow_html=True)

# Tampilkan riwayat chat
for i, msg in enumerate(st.session_state.messages):
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg["role"] == "assistant":
            with st.popover("Bagaimana jawaban ini?"):
                st.feedback("stars", key=f"rating_{i}")

# ── Tentukan pertanyaan yang akan diproses ─────────────
user_message = st.session_state.trigger_question
st.session_state.trigger_question = None   # reset

new_input = st.chat_input("Tanyakan hal lain...")
if new_input:
    user_message = new_input

# ── Proses pertanyaan ─────────────────────────────────
if user_message:
    with st.chat_message("user"):
        st.markdown(user_message)

    with st.chat_message("assistant"):
        with st.spinner("Mencari jawaban dari dokumen..."):
            result = api_qa_ask(user_message)

        if result.get("success"):
            answer = result.get("answer", "Maaf, tidak ada jawaban ditemukan.")

            # Efek mengetik
            placeholder = st.empty()
            displayed   = ""
            for word in answer.split():
                displayed += word + " "
                placeholder.markdown(displayed + "▌")
                time.sleep(0.03)
            placeholder.markdown(displayed)

            # Tampilkan sumber dokumen jika ada
            sources = result.get("source_chunks", [])
            if sources:
                with st.expander("📄 Sumber dari dokumen"):
                    for j, chunk in enumerate(sources, 1):
                        st.caption(f"**Chunk {j}:** {chunk[:250]}...")

        else:
            error = result.get("error", "Terjadi kesalahan.")
            # Jika belum ada dokumen di-index, tampilkan panduan
            if "empty" in error.lower() or "index" in error.lower() \
               or "tidak ada" in error.lower():
                displayed = ("💡 **Belum ada dokumen yang diindeks.**\n\n"
                             "Untuk hasil terbaik:\n"
                             "1. Pergi ke halaman **Klasifikasi**\n"
                             "2. Upload dokumen perusahaan kamu\n"
                             "3. Kembali ke sini dan tanyakan isinya\n\n"
                             "Atau saya bisa menjawab pertanyaan umum "
                             "berdasarkan pengetahuan saya.")
            else:
                displayed = f"❌ {error}"
            st.markdown(displayed)

        with st.popover("Bagaimana jawaban ini?"):
            st.feedback("stars",
                        key=f"new_rating_{len(st.session_state.messages)}")

    st.session_state.messages.append({"role": "user",      "content": user_message})
    st.session_state.messages.append({"role": "assistant", "content": displayed})
    st.rerun()
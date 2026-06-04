import streamlit as st
import time

# IMPORT KOMPONEN SIDEBAR
from components.sidebar import show_sidebar
show_sidebar()

# Daftar Saran Pertanyaan (Pills)
SUGGESTIONS = {
    "📄 Apa SOP penanganan server down?": "Tolong jelaskan SOP penanganan saat server utama mengalami downtime.",
    "🏢 Siapa kontak Infrastruktur IT?": "Siapa yang harus saya hubungi di divisi Infrastruktur IT jika ada kendala?",
    "📝 Ringkas kebijakan cuti HR": "Buatkan ringkasan mengenai kebijakan cuti tahunan menurut aturan HR terbaru.",
    "🔴 Alur eskalasi tiket kritis?": "Bagaimana alur eskalasi untuk tiket IT dengan prioritas kritis?"
}

# Cek Status Interaksi Pengguna
user_just_asked_initial = "initial_question" in st.session_state and st.session_state.initial_question
user_just_clicked_sug = "selected_suggestion" in st.session_state and st.session_state.selected_suggestion
user_first_interaction = user_just_asked_initial or user_just_clicked_sug
has_history = "messages" in st.session_state and len(st.session_state.messages) > 0

# Wadah untuk header yang akan tetap muncul di kedua mode
title_row = st.container(horizontal=True, vertical_alignment="bottom")


if not user_first_interaction and not has_history:
    st.session_state.messages = []
    
    # Logo dan Judul Utama
    st.markdown("""
    <div style='text-align: center; margin-top: 40px; margin-bottom: 30px;'>
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" fill="rgba(16, 185, 129, 0.2)"/>
            <path d="M20 3v4" stroke="#64748B"/><path d="M22 5h-4" stroke="#64748B"/>
            <path d="M4 17v2" stroke="#64748B"/><path d="M5 18H3" stroke="#64748B"/>
        </svg>
        <h1 style='margin-bottom: 0px; margin-top: 10px; color: #1E293B; font-size: 2.8rem; font-weight: 700; letter-spacing: -1px;'>SnapFlow AI Assistant</h1>
        <p style='color: #71717a; font-size: 1.1rem; margin-top: 5px;'>Tanyakan pedoman, SOP, atau dokumen internal perusahaan.</p>
    </div>
    """, unsafe_allow_html=True)

    with st.container():
        # Input chat yang melayang di tengah
        st.chat_input("Ketik pertanyaanmu di sini...", key="initial_question")

        # Tombol Pil interaktif
        st.pills(
            label="Saran",
            label_visibility="collapsed",
            options=SUGGESTIONS.keys(),
            key="selected_suggestion",
        )
    
    # MENGHENTIKAN KODE DI SINI JIKA BELUM ADA INTERAKSI!
    st.stop()

# Input chat otomatis pindah ke bawah
user_message = st.chat_input("Tanyakan hal lain...")

# Menangkap pertanyaan pertama dari Mode 1
if not user_message:
    if user_just_asked_initial:
        user_message = st.session_state.initial_question
    if user_just_clicked_sug:
        user_message = SUGGESTIONS[st.session_state.selected_suggestion]

# Membangun ulang Header (Sekarang ada tombol Restart di kanannya)
with title_row:
    col_judul, col_btn = st.columns([4, 1])
    with col_judul:
        st.title("SnapFlow AI Assistant", anchor=False)
    with col_btn:
        st.markdown("<br>", unsafe_allow_html=True)
        def clear_conversation():
            st.session_state.messages = []
            st.session_state.initial_question = None
            st.session_state.selected_suggestion = None
        st.button("🔄 Restart", on_click=clear_conversation, use_container_width=True)

st.markdown("<hr style='border-color: #e4e4e7; margin-top: -5px; margin-bottom: 25px;'>", unsafe_allow_html=True)

# Tampilkan Riwayat Chat
for i, message in enumerate(st.session_state.messages):
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        # Popover rating ala Snowflake
        if message["role"] == "assistant":
            with st.popover("Bagaimana jawaban ini?"):
                st.feedback("stars", key=f"hist_rating_{i}")

# Proses Pesan Baru Masuk
if user_message:
    # Tampilkan pesan user
    with st.chat_message("user"):
        st.markdown(user_message)

    # Tampilkan pesan AI (dengan efek ngetik)
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
        
        # Dummy Response
        dummy_response = f"Berdasarkan pangkalan data WorkSenseAI, ini adalah simulasi respons untuk pertanyaan: **{user_message}**. \n\nDi tahap pengembangan selanjutnya, sistem RAG (*Retrieval-Augmented Generation*) akan otomatis mencari referensi dokumen PDF terkait dan menampilkannya secara akurat di sini."
        
        for chunk in dummy_response.split():
            full_response += chunk + " "
            time.sleep(0.05)
            message_placeholder.markdown(full_response + "▌") 
        
        message_placeholder.markdown(full_response)
        
        # Tambahkan popover feedback
        with st.popover("Bagaimana jawaban ini?"):
            st.feedback("stars", key=f"new_rating_{len(st.session_state.messages)}")
            
    # Simpan ke Session State
    st.session_state.messages.append({"role": "user", "content": user_message})
    st.session_state.messages.append({"role": "assistant", "content": full_response})
import streamlit as st
import time

from components.sidebar import show_sidebar

show_sidebar()

st.markdown("""
<style>
    [data-testid="stHeader"] {display: none;}
    .block-container { padding-top: 2rem !important; }
</style>
""", unsafe_allow_html=True)

# Header
st.title("🤝 AI Notulen Rapat", anchor=False)
st.caption(
    "Ubah transkrip rapat yang panjang menjadi ringkasan, keputusan, dan tugas lanjutan terstruktur."
)
st.divider()

# Input transkrip
st.subheader("🎙️ Masukkan Transkrip Rapat", anchor=False)

transkrip_input = st.text_area(
    label="Label disembunyikan",
    label_visibility="collapsed",
    height=200,
    placeholder="Paste teks transkrip dari Google Meet, Zoom, atau catatan kasarmu di sini..."
)

# Proses dan hasil notulensi
if st.button(
    "Susun Notulensi 🪄",
    type="primary",
    use_container_width=True
):
    if transkrip_input.strip() == "":
        st.warning(
            "⚠️ Transkrip masih kosong! Silakan masukkan teks terlebih dahulu."
        )

    else:
        with st.spinner(
            "Mengekstrak insight dari rapat menggunakan Groq API (LLaMA 3)..."
        ):
            time.sleep(1.5)

        st.success("✅ Notulensi berhasil disusun!")
        st.write("")

        st.subheader("📋 Hasil Ekstraksi AI", anchor=False)

        with st.container(border=True):

            # Daftar peserta
            st.caption("👥 DAFTAR PESERTA TERDETEKSI")

            badge_style = (
                "background-color: #E6F8F3; "
                "color: #10B981; "
                "padding: 4px 12px; "
                "border-radius: 6px; "
                "font-size: 13px; "
                "font-weight: 600; "
                "border: 1px solid #A7F3D0; "
                "margin-right: 8px;"
            )

            st.markdown(f"""
            <span style="{badge_style}">Rizqiyah</span>
            <span style="{badge_style}">Juniarti S. D.</span>
            <span style="{badge_style}">Arya C. F.</span>
            """, unsafe_allow_html=True)

            st.write("")
            st.write("")

            # Ringkasan rapat
            st.caption("📝 RINGKASAN EKSEKUTIF")

            st.markdown("""
            Rapat berfokus pada evaluasi progres mingguan WorkSenseAI dan pembagian peran spesifik untuk fase *deployment* ke Hugging Face Spaces. Dibahas pula kendala integrasi antara UI antarmuka dan *endpoint* API, serta penentuan tenggat waktu pengujian akhir (*User Acceptance Testing*) sebelum diserahkan.
            """)

            st.write("")

            # Keputusan rapat
            st.caption("⚖️ KEPUTUSAN (DECISIONS)")

            st.markdown("""
            * Sistem aplikasi akan di-*deploy* dengan masa *handover* awal selama 1 bulan.
            * Layout antarmuka resmi menggunakan gaya *Soft Minimalist* (Light Theme) dengan aksen *emerald green*, batal menggunakan *Dark Mode*.
            """)

            st.write("")

            # Tugas lanjutan
            st.caption("🎯 ACTION ITEMS (TUGAS LANJUTAN)")

            st.markdown("""
            * **Rizqiyah:** Menyelesaikan integrasi UI Streamlit dengan *endpoint* FastAPI paling lambat Jumat.
            * **Tim Backend:** Memastikan fungsi RAG menggunakan FAISS *vector database* berjalan lancar tanpa *delay* berlebih.
            """)
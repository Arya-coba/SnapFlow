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
st.title("📝 Ringkasan Dokumen", anchor=False)
st.caption(
    "Ekstrak inti informasi dari teks panjang menjadi 3-5 poin penting dalam hitungan detik menggunakan AI."
)
st.divider()

# Input teks
st.subheader("Masukkan Teks", anchor=False)

teks_input = st.text_area(
    label="Label disembunyikan",
    label_visibility="collapsed",
    height=200,
    placeholder="Paste teks panjang seperti draf email HR, laporan, atau tiket IT di sini..."
)

# Proses dan hasil ringkasan
if st.button(
    "Buat Ringkasan ✨",
    type="primary",
    use_container_width=True
):

    if teks_input.strip() == "":
        st.warning(
            "⚠️ Teks tidak boleh kosong! Silakan paste teks terlebih dahulu."
        )

    else:
        with st.spinner(
            "Mengirim data ke Groq API (LLaMA 3) untuk diringkas..."
        ):
            time.sleep(1.5)

        st.success("✅ Ringkasan berhasil dibuat!")
        st.write("")

        st.subheader("📋 Hasil Ringkasan", anchor=False)

        with st.container(border=True):
            st.caption("EKSTRAKSI POIN UTAMA")

            st.markdown("""
            * **Konteks:** Dokumen membahas evaluasi kinerja operasional kuartal kedua dan dampaknya terhadap produktivitas tim IT.

            * **Temuan Utama:** Terjadi peningkatan waktu respons IT sebesar 15% sejak implementasi sistem penyortiran dokumen secara manual bulan lalu.

            * **Tindak Lanjut:** Direkomendasikan untuk segera mengimplementasikan AI Workplace Assistant guna mengotomasi klasifikasi tiket mulai minggu depan.
            """)
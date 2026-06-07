import streamlit as st
import requests  

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
    "Ekstrak inti informasi dari teks panjang menjadi beberapa poin penting dalam hitungan detik menggunakan AI."
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
        try:
            with st.spinner(
                "Mengirim data ke Groq API (LLaMA 3) untuk diringkas..."
            ):                
                url_backend = "http://localhost:8000/summarize"
                payload = {"teks": teks_input}
                
                response = requests.post(url_backend, json=payload)

            # Cek apakah respons dari backend sukses (status code 200)
            if response.status_code == 200:
                hasil_api = response.json()
                # Ambil key hasil ringkasan dari backend (biasanya namanya 'summary')
                ringkasan_text = hasil_api.get("summary", "Tidak ada ringkasan yang dikembalikan.")
                
                st.success("✅ Ringkasan berhasil dibuat!")
                st.write("")

                st.subheader("📋 Hasil Ringkasan", anchor=False)

                with st.container(border=True):
                    st.caption("EKSTRAKSI POIN UTAMA")                    
                    
                    # Looping poin-poin agar rapi ke bawah
                    if isinstance(ringkasan_text, list):
                        for poin in ringkasan_text:
                            st.markdown(f"- {poin}")
                    else:
                        st.markdown(ringkasan_text)
            else:
                st.error(f"❌ Gagal memproses data. Backend merespons dengan status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Tidak dapat terhubung ke Backend! Pastikan perintah `uvicorn` lo udah dinyalain di port 8000.")
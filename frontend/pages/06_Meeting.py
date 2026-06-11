import streamlit as st
import requests  

from components.sidebar import show_sidebar

show_sidebar()

st.markdown("""
<style>
    [data-testid="stHeader"] {display: none;}
    .block-container { padding-top: 2rem !important; }
    
    /* ☀️ CSS CUSTOM BIAR TETEP TEMA TERANG DAN OTOMATIS TURUN KE BAWAH */
    .custom-text-box {
        white-space: pre-wrap;       
        word-wrap: break-word;              
        color: #1E293B;             
        background-color: #FFFFFF;   
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #E2E8F0;   /* Garis tepi abu-abu tipis */
        line-height: 1.6;
    }
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
        try:
            with st.spinner(
                "Mengekstrak insight dari rapat menggunakan Groq API (LLaMA 3)..."
            ):                
                url_backend = "http://localhost:8000/meeting"
                payload = {"teks": transkrip_input}
                
                response = requests.post(url_backend, json=payload)

            # Cek apakah respons dari backend sukses (status code 200)
            if response.status_code == 200:
                hasil_api = response.json()
                
                # Ambil format teks cakep ber-emoji dari backend punya Arya
                formatted_text = hasil_api.get("formatted", "")
                
                st.success("✅ Notulensi berhasil disusun!")
                st.write("")
                st.subheader("📋 Hasil Ekstraksi AI", anchor=False)
                
                # Ditampilkan pake HTML custom agar dipaksa turun ke bawah kodenya
                if formatted_text:
                    st.markdown(f'<div class="custom-text-box">{formatted_text}</div>', unsafe_allow_html=True)
                else:
                    st.markdown(str(hasil_api))
                                
            else:
                st.error(f"❌ Gagal memproses transkrip. Backend merespons dengan status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Tidak dapat terhubung ke Backend! Pastikan perintah `uvicorn` lo udah dinyalain di port 8000.")
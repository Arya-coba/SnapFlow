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
st.title("📄 Analisis Dokumen AI", anchor=False)
st.caption("Unggah dokumen operasional untuk mendapatkan klasifikasi, prioritas, dan ringkasan instan.")
st.divider()

# Upload dokumen
uploaded_file = st.file_uploader(
    "Seret dan lepas file di sini",
    type=["txt", "pdf"]
)

if uploaded_file is not None:

    with st.container(border=True):
        col_icon, col_text = st.columns(
            [1, 15],
            vertical_alignment="center"
        )

        with col_icon:
            st.subheader("📎", anchor=False)

        with col_text:
            st.markdown(f"**{uploaded_file.name}**")
            st.caption("Siap untuk diproses oleh WorkSenseAI")

    st.write("")

    if st.button(
        "🚀 Eksekusi Analisis AI",
        type="primary",
        use_container_width=True
    ):

        # Simulasi proses analisis
        my_bar = st.progress(
            0,
            text="Memulai ekstraksi teks..."
        )

        time.sleep(0.5)
        my_bar.progress(
            30,
            text="Mengklasifikasikan kategori dan memprediksi prioritas..."
        )

        time.sleep(0.8)
        my_bar.progress(
            70,
            text="Menyusun ringkasan eksekutif dengan LLaMA 3..."
        )

        time.sleep(0.7)
        my_bar.progress(
            100,
            text="Analisis selesai!"
        )

        time.sleep(0.3)
        my_bar.empty()

        # Hasil analisis
        st.subheader("📊 Laporan Hasil Analisis", anchor=False)

        col1, col2 = st.columns(
            [1.2, 2],
            gap="large"
        )

        # Klasifikasi dan routing
        with col1:
            with st.container(border=True):
                st.caption("KATEGORI DETEKSI")

                st.markdown("""
                <span style="background-color: #E6F8F3; color: #10B981; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #A7F3D0;">
                    💻 Tiket IT
                </span>
                """, unsafe_allow_html=True)

                st.write("")

                st.caption("TINGKAT PRIORITAS")

                st.markdown("""
                <span style="background-color: #FEE2E2; color: #EF4444; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #FECACA;">
                    🔴 Kritis (Tinggi)
                </span>
                """, unsafe_allow_html=True)

                st.write("")

                st.caption("ROUTING REKOMENDASI")

                st.markdown("""
                <div style="display: flex; align-items: center; background-color: #f3f8fd; padding: 10px 15px; border-radius: 8px; border: 1px solid #e4e4e7;">
                    <span style="font-size: 18px; margin-right: 10px;">🛡️</span>
                    <p style="color: #1E293B; margin: 0; font-weight: 600; font-size: 14px;">
                        Divisi Infrastruktur IT
                    </p>
                </div>
                """, unsafe_allow_html=True)

        # Ringkasan dokumen
        with col2:
            with st.container(border=True):
                st.caption("📝 RINGKASAN EKSEKUTIF")

                st.markdown("""
                * **Insiden Utama:** Server pusat (Node A) mengalami *downtime* yang tidak terduga sejak pukul 08:00 WIT, memutus akses sistem internal.

                * **Analisis Log:** Data awal menunjukkan adanya kegagalan beruntun pada sistem pendingin di ruang server lantai 3.

                * **Tindakan Diperlukan:** Dibutuhkan penanganan darurat *on-site* segera oleh teknisi untuk mematikan daya secara manual guna mencegah *hardware overheating* permanen.
                """)
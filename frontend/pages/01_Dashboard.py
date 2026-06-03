import streamlit as st
import pandas as pd

from components.sidebar import show_sidebar

show_sidebar()

# Header
st.title("📊 Dashboard Analisis", anchor=False)
st.caption("Pantau distribusi dokumen operasional dan performa model AI.")
st.divider()

# Kartu metrik
col1, col2, col3 = st.columns(3)

with col1:
    with st.container(border=True):
        st.metric(
            label="Total Dokumen Diproses",
            value="1,248",
            delta="12% dari minggu lalu"
        )

with col2:
    with st.container(border=True):
        st.metric(
            label="Prioritas Tinggi",
            value="342",
            delta="-5% (Lebih baik)",
            delta_color="inverse"
        )

with col3:
    with st.container(border=True):
        st.metric(
            label="Akurasi Model IndoBERT",
            value="92.4%",
            delta="Target tercapai",
            delta_color="normal"
        )

st.write("")

# Grafik dan aktivitas terakhir
col_chart, col_list = st.columns([1.5, 1], gap="large")

with col_chart:
    st.subheader("📈 Distribusi Kategori", anchor=False)

    chart_data = pd.DataFrame({
        "Kategori": [
            "Tiket IT",
            "Email HR",
            "Laporan",
            "SOP",
            "Pengadaan"
        ],
        "Jumlah": [450, 300, 150, 104, 200]
    })

    st.bar_chart(
        chart_data.set_index("Kategori"),
        color="#10B981"
    )

with col_list:
    st.subheader("🕒 Dokumen Terakhir", anchor=False)

    with st.container(border=True):
        st.markdown("**Server Down - Tiket IT**")
        st.caption("🔴 Prioritas Tinggi | 2 menit yang lalu")

    with st.container(border=True):
        st.markdown("**Cuti Tahunan - Email HR**")
        st.caption("🟢 Prioritas Rendah | 15 menit yang lalu")

    with st.container(border=True):
        st.markdown("**Revisi SOP Keamanan - SOP**")
        st.caption("🟡 Prioritas Sedang | 1 jam yang lalu")
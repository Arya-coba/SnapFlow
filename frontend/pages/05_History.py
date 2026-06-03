import streamlit as st
import pandas as pd

from components.sidebar import show_sidebar

show_sidebar()

# Header
st.title("🗂️ Riwayat Dokumen", anchor=False)
st.caption(
    "Telusuri dan kelola arsip dokumen yang telah diproses oleh antarmuka WorkSenseAI."
)
st.divider()

# Filter dan pencarian
col_search, col_kat, col_prio = st.columns([2, 1, 1])

with col_search:
    search_query = st.text_input(
        "🔍 Cari Dokumen",
        placeholder="Ketik nama file..."
    )

with col_kat:
    filter_kategori = st.selectbox(
        "Kategori",
        [
            "Semua",
            "Tiket IT",
            "Email HR",
            "Laporan Keuangan",
            "SOP",
            "Permintaan Pengadaan"
        ]
    )

with col_prio:
    filter_prioritas = st.selectbox(
        "Prioritas",
        [
            "Semua",
            "🔴 Tinggi",
            "🟡 Sedang",
            "🟢 Rendah"
        ]
    )

st.write("")

# Data dokumen
data = {
    "Tanggal": [
        "2026-06-03 07:15",
        "2026-06-02 14:30",
        "2026-06-02 09:10",
        "2026-06-01 16:45",
        "2026-05-30 11:20"
    ],
    "Nama Dokumen": [
        "Server_Down_Report.txt",
        "Cuti_Tahunan_Staf.pdf",
        "Revisi_SOP_Keamanan.pdf",
        "Invoice_Layanan_Cloud.pdf",
        "Pengadaan_Router.txt"
    ],
    "Kategori": [
        "Tiket IT",
        "Email HR",
        "SOP",
        "Laporan Keuangan",
        "Permintaan Pengadaan"
    ],
    "Prioritas": [
        "🔴 Tinggi",
        "🟢 Rendah",
        "🟡 Sedang",
        "🔴 Tinggi",
        "🟡 Sedang"
    ],
    "Akurasi AI": [
        "98",
        "95",
        "89",
        "92",
        "94"
    ]
}

df = pd.DataFrame(data)

# Konversi tipe data
df["Akurasi AI"] = pd.to_numeric(df["Akurasi AI"])
df["Tanggal"] = pd.to_datetime(df["Tanggal"])

# Filter data
if search_query:
    df = df[
        df["Nama Dokumen"].str.contains(
            search_query,
            case=False
        )
    ]

if filter_kategori != "Semua":
    df = df[
        df["Kategori"] == filter_kategori
    ]

if filter_prioritas != "Semua":
    df = df[
        df["Prioritas"] == filter_prioritas
    ]

# Tabel dokumen
st.subheader("📂 Arsip Tersimpan", anchor=False)

event = st.dataframe(
    df,
    use_container_width=True,
    hide_index=True,
    on_select="rerun",
    selection_mode="multi-row",
    column_config={
        "Tanggal": st.column_config.DatetimeColumn(
            "Waktu Proses",
            format="DD MMM YYYY, HH:mm"
        ),
        "Nama Dokumen": st.column_config.TextColumn(
            "Nama Dokumen",
            width="large"
        ),
        "Kategori": st.column_config.TextColumn(
            "Kategori",
            width="medium"
        ),
        "Prioritas": st.column_config.TextColumn(
            "Prioritas",
            width="small"
        ),
        "Akurasi AI": st.column_config.ProgressColumn(
            "Confidence Score (%)",
            format="%d",
            min_value=0,
            max_value=100
        )
    }
)

baris_terpilih = event.selection.rows

st.write("")

# Aksi data
col_btn1, col_btn2, col_btn3 = st.columns([1, 1, 2])

with col_btn1:
    st.button(
        "📥 Ekspor CSV",
        use_container_width=True
    )

with col_btn2:
    if st.button(
        "🗑️ Hapus Terpilih",
        use_container_width=True,
        disabled=len(baris_terpilih) == 0
    ):
        st.success(
            f"✅ Berhasil menghapus {len(baris_terpilih)} dokumen dari arsip SQLite!"
        )
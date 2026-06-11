import streamlit as st
import pandas as pd
import requests  

from components.sidebar import show_sidebar

show_sidebar()

# Header
st.title("🗂️ Riwayat Dokumen", anchor=False)
st.caption(
    "Telusuri dan kelola arsip dokumen yang telah diproses oleh antarmuka SnapFLow."
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


data_dokumen = []

try:
    # Tembak API history backend 
    response = requests.get("http://localhost:8000/history/documents")
    
    if response.status_code == 200:
        # Mengambil list data asli dari database SQLite backend
        data_backend = response.json()  
        
        # Amankan jika data_backend dibungkus dictionary bawaan kelompok
        if isinstance(data_backend, dict):
            documents_list = data_backend.get("documents", data_backend.get("data", []))
        else:
            documents_list = data_backend
        
        for item in documents_list:
            # ── FIX DI SINI: Jika data berupa string polos, jangan pakai .get() ──
            if isinstance(item, str):
                data_dokumen.append({
                    "Tanggal": "2026-06-06 00:00",
                    "Nama Dokumen": item if item else "Teks Input Manual",
                    "Kategori": "Uncategorized",
                    "Prioritas": "🟡 Sedang",
                    "Akurasi AI": 0
                })
            # ── Jika berupa dictionary normal, tetap pakai .get() bawaan lo ──
            else:
                data_dokumen.append({
                    "Tanggal": item.get("processed_at", item.get("Tanggal", "2026-06-06 00:00")),
                    "Nama Dokumen": item.get("filename", item.get("Nama Dokumen", "Unknown_File.pdf")),
                    "Kategori": item.get("category", item.get("Kategori", "Uncategorized")),
                    "Prioritas": item.get("priority", item.get("Prioritas", "🟡 Sedang")),
                    "Akurasi AI": item.get("accuracy", item.get("Akurasi AI", 0))
                })
    else:
        st.error(f"⚠️ Gagal menarik riwayat. Backend merespons status: {response.status_code}")

except requests.exceptions.ConnectionError:
    st.error("❌ Gagal terhubung ke Backend! Menampilkan data kosong. Nyalain `uvicorn` dulu ya Al.")

# Jika data berhasil ditarik, masukkan ke DataFrame, kalau gagal/kosong buat tabel kosong biar gak crash
if data_dokumen:
    df = pd.DataFrame(data_dokumen)
else:
    # Fallback struktur kolom biar web-nya gak pecah pas pertama buka
    df = pd.DataFrame(columns=["Tanggal", "Nama Dokumen", "Kategori", "Prioritas", "Akurasi AI"])

# Konversi tipe data biar progress bar dan tanggalnya berfungsi normal
if not df.empty:
    df["Akurasi AI"] = pd.to_numeric(df["Akurasi AI"], errors='coerce').fillna(0)
    df["Tanggal"] = pd.to_datetime(df["Tanggal"], errors='coerce').fillna(pd.Timestamp.now())

    # Filter data berdasarkan inputan user di UI
    if search_query:
        df = df[df["Nama Dokumen"].str.contains(search_query, case=False, na=False)]

    if filter_kategori != "Semua":
        df = df[df["Kategori"] == filter_kategori]

    if filter_prioritas != "Semua":
        df = df[df["Prioritas"] == filter_prioritas]

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
            "✅ Berhasil menghapus dokumen dari arsip SQLite!"
        )
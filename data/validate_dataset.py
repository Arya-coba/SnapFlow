# data/validate_dataset.py
# SnapFlow — Validasi dan bersihkan dataset

import pandas as pd
from sklearn.model_selection import train_test_split

# ── Load dataset ──────────────────────────────────────────
df = pd.read_csv("data/raw/dataset_raw.csv")
print(f"📊 Total data mentah: {len(df)}")

# ── Cek distribusi ────────────────────────────────────────
print("\n📋 Distribusi Kategori:")
print(df["kategori"].value_counts())

print("\n🚨 Distribusi Prioritas:")
print(df["prioritas"].value_counts())

# ── Bersihkan data ────────────────────────────────────────
# Hapus duplikat
df = df.drop_duplicates(subset=["teks"])
print(f"\n🗑️  Setelah hapus duplikat: {len(df)}")

# Hapus teks terlalu pendek (< 50 karakter)
df = df[df["teks"].str.len() >= 50]
print(f"✂️  Setelah filter teks pendek: {len(df)}")

# Hapus null
df = df.dropna()
print(f"🧹 Setelah hapus null: {len(df)}")

# Validasi label kategori
valid_kategori = [
    "Tiket IT",
    "Email HR",
    "Laporan Keuangan",
    "SOP",
    "Permintaan Pengadaan"
]
df = df[df["kategori"].isin(valid_kategori)]
print(f"✅ Setelah validasi label kategori: {len(df)}")

# Validasi label prioritas
valid_prioritas = ["Tinggi", "Sedang", "Rendah"]
df = df[df["prioritas"].isin(valid_prioritas)]
print(f"✅ Setelah validasi label prioritas: {len(df)}")

# ── Simpan dataset bersih ─────────────────────────────────
df.to_csv("data/processed/dataset_clean.csv", index=False)
print(f"\n💾 Dataset bersih disimpan: data/processed/dataset_clean.csv")

# ── Split dataset ─────────────────────────────────────────
# 80% train, 10% validation, 10% test
train_df, temp_df = train_test_split(
    df, test_size=0.2, random_state=42,
    stratify=df["kategori"]
)
val_df, test_df = train_test_split(
    temp_df, test_size=0.5, random_state=42,
    stratify=temp_df["kategori"]
)

train_df.to_csv("data/processed/train.csv", index=False)
val_df.to_csv("data/processed/val.csv", index=False)
test_df.to_csv("data/processed/test.csv", index=False)

print(f"\n📁 Split dataset:")
print(f"  Train : {len(train_df)} data (80%)")
print(f"  Val   : {len(val_df)} data (10%)")
print(f"  Test  : {len(test_df)} data (10%)")

# ── Distribusi final ──────────────────────────────────────
print("\n📊 Distribusi Final (Train):")
print(train_df["kategori"].value_counts())
print("\n📊 Distribusi Final (Val):")
print(val_df["kategori"].value_counts())
print("\n📊 Distribusi Final (Test):")
print(test_df["kategori"].value_counts())

print("\n✅ Selesai! Dataset siap untuk training.")
# data/parse_json_to_csv.py
# SnapFlow — AI Workplace Assistant
# Script untuk menggabungkan semua file JSON dataset menjadi satu CSV

import json
import os
import pandas as pd

# ── Konfigurasi ───────────────────────────────────────────────────────────────
JSON_FOLDER  = "data/raw/json"       # folder semua file JSON
OUTPUT_RAW   = "data/raw/dataset_raw.csv"  # output CSV mentah

VALID_KATEGORI = [
    "Tiket IT",
    "Email HR",
    "Laporan Keuangan",
    "SOP",
    "Permintaan Pengadaan"
]

VALID_PRIORITAS = ["Tinggi", "Sedang", "Rendah"]


# ── Load semua JSON ───────────────────────────────────────────────────────────
def load_all_json(folder: str) -> list:
    """
    Load semua file .json dari folder dan gabungkan jadi satu list.
    Handle berbagai format output AI (array langsung atau ada wrapper).
    """
    all_data = []
    error_files = []
    skipped = 0

    # Cek folder ada
    if not os.path.exists(folder):
        print(f"❌ Folder tidak ditemukan: {folder}")
        print(f"   Buat folder dulu: mkdir -p {folder}")
        return []

    json_files = [f for f in os.listdir(folder) if f.endswith(".json")]

    if not json_files:
        print(f"❌ Tidak ada file .json di folder: {folder}")
        return []

    print(f"📂 Ditemukan {len(json_files)} file JSON\n")

    for filename in sorted(json_files):
        filepath = os.path.join(folder, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read().strip()

            # Handle berbagai format output AI
            # Format 1: langsung array [ {...}, {...} ]
            # Format 2: ada wrapper { "data": [ {...} ] }
            # Format 3: ada backtick ```json ... ```
            content = _clean_json_string(content)
            data    = json.loads(content)

            # Kalau bukan list, coba ambil value pertama yang list
            if isinstance(data, dict):
                for v in data.values():
                    if isinstance(v, list):
                        data = v
                        break

            if not isinstance(data, list):
                print(f"  ⚠️  {filename}: Format tidak dikenali, skip")
                error_files.append(filename)
                continue

            # Validasi setiap item
            valid_items = []
            for item in data:
                if not isinstance(item, dict):
                    skipped += 1
                    continue
                if "teks" not in item or "kategori" not in item or "prioritas" not in item:
                    skipped += 1
                    continue
                valid_items.append({
                    "teks"     : str(item["teks"]).strip(),
                    "kategori" : str(item["kategori"]).strip(),
                    "prioritas": str(item["prioritas"]).strip()
                })

            all_data.extend(valid_items)
            print(f"  ✅ {filename}: {len(valid_items)} data dimuat")

        except json.JSONDecodeError as e:
            print(f"  ❌ {filename}: JSON tidak valid — {str(e)[:50]}")
            error_files.append(filename)
        except Exception as e:
            print(f"  ❌ {filename}: Error — {str(e)[:50]}")
            error_files.append(filename)

    print(f"\n📊 Total data dimuat   : {len(all_data)}")
    print(f"⚠️  Item dilewati       : {skipped}")
    print(f"❌ File bermasalah     : {len(error_files)}")
    if error_files:
        print(f"   File: {', '.join(error_files)}")

    return all_data


# ── Clean JSON string ─────────────────────────────────────────────────────────
def _clean_json_string(content: str) -> str:
    """
    Bersihkan string JSON dari karakter tambahan yang sering ditambahkan AI.
    Contoh: ```json ... ``` atau teks sebelum/sesudah array
    """
    # Hapus markdown code block
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    # Cari array JSON (mulai dari [ sampai ])
    start = content.find("[")
    end   = content.rfind("]") + 1
    if start != -1 and end > start:
        content = content[start:end]

    return content


# ── Bersihkan & validasi data ─────────────────────────────────────────────────
def clean_data(data: list) -> pd.DataFrame:
    """
    Bersihkan dan validasi semua data sebelum disimpan ke CSV.
    """
    df = pd.DataFrame(data)

    print("\n🧹 Membersihkan data...")
    initial = len(df)

    # Hapus baris dengan nilai kosong
    df = df.dropna()
    print(f"  Hapus null          : {initial - len(df)} baris dihapus")

    # Hapus teks terlalu pendek
    before = len(df)
    df = df[df["teks"].str.len() >= 50]
    print(f"  Hapus teks pendek   : {before - len(df)} baris dihapus")

    # Validasi label kategori
    before = len(df)
    df = df[df["kategori"].isin(VALID_KATEGORI)]
    print(f"  Validasi kategori   : {before - len(df)} baris dihapus")

    # Validasi label prioritas
    before = len(df)
    df = df[df["prioritas"].isin(VALID_PRIORITAS)]
    print(f"  Validasi prioritas  : {before - len(df)} baris dihapus")

    # Hapus duplikat berdasarkan teks
    before = len(df)
    df = df.drop_duplicates(subset=["teks"])
    print(f"  Hapus duplikat      : {before - len(df)} baris dihapus")

    # Reset index
    df = df.reset_index(drop=True)

    return df


# ── Tampilkan statistik ───────────────────────────────────────────────────────
def show_stats(df: pd.DataFrame):
    """Tampilkan statistik distribusi dataset."""
    print("\n" + "=" * 55)
    print("📊 STATISTIK DATASET FINAL")
    print("=" * 55)
    print(f"Total data: {len(df)}\n")

    print("Distribusi Kategori:")
    for kat, count in df["kategori"].value_counts().items():
        bar   = "█" * (count // 5)
        pct   = count / len(df) * 100
        print(f"  {kat:<25} {count:>4} ({pct:.1f}%) {bar}")

    print("\nDistribusi Prioritas:")
    for pri, count in df["prioritas"].value_counts().items():
        bar   = "█" * (count // 10)
        pct   = count / len(df) * 100
        print(f"  {pri:<10} {count:>4} ({pct:.1f}%) {bar}")

    print("\nDistribusi Kategori × Prioritas:")
    cross = pd.crosstab(df["kategori"], df["prioritas"])
    print(cross.to_string())
    print("=" * 55)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("SnapFlow — Dataset Builder")
    print("Menggabungkan semua JSON → dataset_raw.csv")
    print("=" * 55 + "\n")

    # Load semua JSON
    all_data = load_all_json(JSON_FOLDER)

    if not all_data:
        print("\n❌ Tidak ada data yang berhasil dimuat. Selesai.")
        return

    # Bersihkan data
    df = clean_data(all_data)

    if len(df) == 0:
        print("\n❌ Tidak ada data valid setelah dibersihkan.")
        return

    # Tampilkan statistik
    show_stats(df)

    # Simpan ke CSV
    os.makedirs("data/raw", exist_ok=True)
    df.to_csv(OUTPUT_RAW, index=False, encoding="utf-8-sig")
    print(f"\n💾 Dataset disimpan ke: {OUTPUT_RAW}")
    print(f"✅ Total data final   : {len(df)}")

    # Cek apakah sudah cukup
    if len(df) >= 1000:
        print("\n🎉 Target 1000 data TERCAPAI! Siap untuk training.")
    else:
        kekurangan = 1000 - len(df)
        print(f"\n⚠️  Masih kurang {kekurangan} data.")
        print(f"   Generate {kekurangan // 30 + 1} sesi lagi dan jalankan ulang script ini.")


if __name__ == "__main__":
    main()
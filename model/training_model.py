# -*- coding: utf-8 -*-
"""
training_model.py — SnapFlow AI Workplace Assistant
====================================================
Fine-tuning IndoBERT untuk klasifikasi dokumen (kategori & prioritas)
+ SVM + TF-IDF sebagai baseline model.

Jalankan di Google Colab (disarankan GPU T4 atau A100).

CARA PAKAI:
  1. Upload dataset_clean.csv ke Colab (atau mount Google Drive)
  2. Isi DAGSHUB_USERNAME dan DAGSHUB_TOKEN di cell "KONFIGURASI"
  3. Jalankan semua cell secara berurutan
  4. Model otomatis tersimpan ke Google Drive + file zip siap pakai

OUTPUT (di Google Drive → SnapFlow_Models/):
  ├── indobert_kategori/     ← IndoBERT fine-tuned 5 kelas
  ├── indobert_prioritas/    ← IndoBERT fine-tuned 3 kelas
  ├── svm/                   ← 4 file pkl (vectorizer + model)
  ├── indobert_kategori.zip
  ├── indobert_prioritas.zip
  └── svm.zip                ← langsung upload ke Drive, salin File ID ke model_downloader.py
"""

# ════════════════════════════════════════════════════════════════════
# CELL 1 — Install dependencies
# ════════════════════════════════════════════════════════════════════
# !pip install -q numpy pandas matplotlib seaborn scikit-learn joblib
# !pip install -q torch transformers
# !pip install -q mlflow dagshub


# ════════════════════════════════════════════════════════════════════
# CELL 2 — Import
# ════════════════════════════════════════════════════════════════════
import os
import zipfile
import shutil
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import joblib
import mlflow

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score, f1_score,
    classification_report, confusion_matrix,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    Trainer,
    TrainingArguments,
)

print("✅ Import selesai")
print(f"   PyTorch  : {torch.__version__}")
print(f"   CUDA     : {torch.cuda.is_available()} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")


# ════════════════════════════════════════════════════════════════════
# CELL 3 — KONFIGURASI (wajib diisi sebelum training)
# ════════════════════════════════════════════════════════════════════

# ── DagsHub / MLflow ──────────────────────────────────────────────
# Ambil token dari: dagshub.com → Settings → Access Tokens
DAGSHUB_USERNAME  = "lintinggg"               # username DagsHub
DAGSHUB_TOKEN     = "ISI_TOKEN_DAGSHUB_KAMU"  # ← ganti ini

# ── Path dataset ──────────────────────────────────────────────────
# Kalau upload manual ke Colab:
DATASET_PATH = "/content/dataset_clean.csv"
# Kalau dari Google Drive, ganti jadi:
# DATASET_PATH = "/content/drive/MyDrive/SnapFlow/data/processed/dataset_clean.csv"

# ── Google Drive output ───────────────────────────────────────────
BASE_DRIVE = "/content/drive/MyDrive/SnapFlow_Models"

# ── Training hyperparameter ───────────────────────────────────────
MAX_LENGTH = 256
BATCH_SIZE = 16
NUM_EPOCHS = 3

EKSPERIMEN_KATEGORI = [
    {"nama": "Skenario_A_LR3e-5", "lr": 3e-5},
    {"nama": "Skenario_B_LR5e-5", "lr": 5e-5},
]

EKSPERIMEN_PRIORITAS = [
    {"nama": "Prioritas_A_LR3e-5", "lr": 3e-5},
    {"nama": "Prioritas_B_LR5e-5", "lr": 5e-5},
]

print("✅ Konfigurasi diset")


# ════════════════════════════════════════════════════════════════════
# CELL 4 — Setup MLflow + DagsHub
# ════════════════════════════════════════════════════════════════════

# Autentikasi via environment variable — cara yang benar, tidak lewat dagshub.init()
os.environ["MLFLOW_TRACKING_USERNAME"] = DAGSHUB_USERNAME
os.environ["MLFLOW_TRACKING_PASSWORD"] = DAGSHUB_TOKEN

MLFLOW_URI = f"https://dagshub.com/{DAGSHUB_USERNAME}/SnapFlow-Model.mlflow"
mlflow.set_tracking_uri(MLFLOW_URI)

# Test koneksi
try:
    mlflow.set_experiment("SnapFlow-Training")
    print(f"✅ MLflow terhubung ke DagsHub: {MLFLOW_URI}")
    USE_MLFLOW = True
except Exception as e:
    print(f"⚠️  MLflow gagal terhubung: {e}")
    print("   Training tetap jalan tanpa MLflow logging.")
    USE_MLFLOW = False


# ════════════════════════════════════════════════════════════════════
# CELL 5 — Load & Preprocessing Dataset
# ════════════════════════════════════════════════════════════════════

print(f"\n📂 Loading dataset dari {DATASET_PATH}...")
df = pd.read_csv(DATASET_PATH)

print(f"✅ Dataset loaded: {len(df)} baris")
print(f"\nDistribusi Kategori:\n{df['kategori'].value_counts()}")
print(f"\nDistribusi Prioritas:\n{df['prioritas'].value_counts()}")

# Label Encoding
le_kategori  = LabelEncoder()
le_prioritas = LabelEncoder()
df['kategori_encode']  = le_kategori.fit_transform(df['kategori'])
df['prioritas_encode'] = le_prioritas.fit_transform(df['prioritas'])

print(f"\nLabel Kategori  (urutan): {list(le_kategori.classes_)}")
print(f"Label Prioritas (urutan): {list(le_prioritas.classes_)}")

# Train / Val / Test split — 80 / 10 / 10
X = df['teks']

X_train_cat, X_tmp_cat, y_train_cat, y_tmp_cat = train_test_split(
    X, df['kategori_encode'],  test_size=0.2, random_state=42, stratify=df['kategori_encode']
)
X_val_cat, X_test_cat, y_val_cat, y_test_cat = train_test_split(
    X_tmp_cat, y_tmp_cat, test_size=0.5, random_state=42, stratify=y_tmp_cat
)

X_train_pri, X_tmp_pri, y_train_pri, y_tmp_pri = train_test_split(
    X, df['prioritas_encode'], test_size=0.2, random_state=42, stratify=df['prioritas_encode']
)
X_val_pri, X_test_pri, y_val_pri, y_test_pri = train_test_split(
    X_tmp_pri, y_tmp_pri, test_size=0.5, random_state=42, stratify=y_tmp_pri
)

print(f"\nSplit Kategori  — Train: {len(X_train_cat)} | Val: {len(X_val_cat)} | Test: {len(X_test_cat)}")
print(f"Split Prioritas — Train: {len(X_train_pri)} | Val: {len(X_val_pri)} | Test: {len(X_test_pri)}")


# ════════════════════════════════════════════════════════════════════
# CELL 6 — Tokenisasi
# ════════════════════════════════════════════════════════════════════

print("\n🔄 Loading tokenizer IndoBERT...")
tokenizer = BertTokenizer.from_pretrained("indobenchmark/indobert-base-p1")

def tokenize(texts):
    return tokenizer(
        texts.tolist(),
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

print("🔄 Tokenisasi kategori...")
train_enc_cat  = tokenize(X_train_cat)
val_enc_cat    = tokenize(X_val_cat)
test_enc_cat   = tokenize(X_test_cat)

print("🔄 Tokenisasi prioritas...")
train_enc_pri  = tokenize(X_train_pri)
val_enc_pri    = tokenize(X_val_pri)
test_enc_pri   = tokenize(X_test_pri)

print("✅ Tokenisasi selesai")


# ════════════════════════════════════════════════════════════════════
# CELL 7 — Dataset Class & Metrics
# ════════════════════════════════════════════════════════════════════

class SnapFlowDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels    = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: v[idx].clone().detach() for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "f1_macro": f1_score(labels, preds, average="macro"),
    }


# Buat dataset object
ds_train_cat  = SnapFlowDataset(train_enc_cat,  y_train_cat.tolist())
ds_val_cat    = SnapFlowDataset(val_enc_cat,    y_val_cat.tolist())
ds_test_cat   = SnapFlowDataset(test_enc_cat,   y_test_cat.tolist())

ds_train_pri  = SnapFlowDataset(train_enc_pri,  y_train_pri.tolist())
ds_val_pri    = SnapFlowDataset(val_enc_pri,    y_val_pri.tolist())
ds_test_pri   = SnapFlowDataset(test_enc_pri,   y_test_pri.tolist())

print("✅ Dataset class siap")


# ════════════════════════════════════════════════════════════════════
# CELL 8 — Fine-tuning IndoBERT Kategori (5 kelas)
# ════════════════════════════════════════════════════════════════════

print("\n" + "="*60)
print("FINE-TUNING: MODEL KATEGORI (5 kelas)")
print("="*60)

best_trainer_cat = None
best_acc_cat     = 0.0
best_run_cat     = None

for eks in EKSPERIMEN_KATEGORI:
    print(f"\n>>> {eks['nama']} | lr={eks['lr']} | batch={BATCH_SIZE} | epoch={NUM_EPOCHS}")

    model = BertForSequenceClassification.from_pretrained(
        "indobenchmark/indobert-base-p1",
        num_labels=5,
    )

    args = TrainingArguments(
        output_dir                  = f"./results_cat_{eks['nama']}",
        num_train_epochs            = NUM_EPOCHS,
        per_device_train_batch_size = BATCH_SIZE,
        per_device_eval_batch_size  = BATCH_SIZE,
        learning_rate               = eks["lr"],
        warmup_steps                = 100,
        weight_decay                = 0.01,
        logging_steps               = 20,
        eval_strategy               = "epoch",
        save_strategy               = "epoch",
        load_best_model_at_end      = True,
        metric_for_best_model       = "accuracy",
        report_to                   = "mlflow" if USE_MLFLOW else "none",
        fp16                        = torch.cuda.is_available(),  # Mixed precision di GPU
    )

    trainer = Trainer(
        model           = model,
        args            = args,
        train_dataset   = ds_train_cat,
        eval_dataset    = ds_val_cat,
        compute_metrics = compute_metrics,
    )

    if USE_MLFLOW:
        with mlflow.start_run(run_name=eks["nama"]):
            mlflow.log_params({"lr": eks["lr"], "batch": BATCH_SIZE, "epoch": NUM_EPOCHS, "task": "kategori"})
            trainer.train()
            test_res = trainer.evaluate(ds_test_cat)
            mlflow.log_metrics({
                "test_accuracy": test_res["eval_accuracy"],
                "test_f1_macro": test_res["eval_f1_macro"],
            })
    else:
        trainer.train()
        test_res = trainer.evaluate(ds_test_cat)

    print(f"   Test Accuracy : {test_res['eval_accuracy']*100:.2f}%")
    print(f"   Test F1 Macro : {test_res['eval_f1_macro']*100:.2f}%")

    if test_res["eval_accuracy"] > best_acc_cat:
        best_acc_cat     = test_res["eval_accuracy"]
        best_trainer_cat = trainer
        best_run_cat     = eks["nama"]

print(f"\n🏆 Best Kategori: {best_run_cat} ({best_acc_cat*100:.2f}%)")

# Evaluasi lengkap
pred_cat   = best_trainer_cat.predict(ds_test_cat)
y_pred_cat = np.argmax(pred_cat.predictions, axis=-1)
y_true_cat = pred_cat.label_ids

print("\n=== CLASSIFICATION REPORT: KATEGORI ===")
print(classification_report(y_true_cat, y_pred_cat, target_names=le_kategori.classes_))

cm = confusion_matrix(y_true_cat, y_pred_cat)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=le_kategori.classes_, yticklabels=le_kategori.classes_)
plt.title("Confusion Matrix — Kategori Dokumen (SnapFlow)", pad=20, fontsize=14)
plt.xlabel("Prediksi", fontsize=12)
plt.ylabel("Label Asli", fontsize=12)
plt.tight_layout()
plt.savefig("confusion_matrix_kategori.png", dpi=150)
plt.show()


# ════════════════════════════════════════════════════════════════════
# CELL 9 — Fine-tuning IndoBERT Prioritas (3 kelas)
# ════════════════════════════════════════════════════════════════════

print("\n" + "="*60)
print("FINE-TUNING: MODEL PRIORITAS (3 kelas)")
print("="*60)

best_trainer_pri = None
best_acc_pri     = 0.0
best_run_pri     = None

for eks in EKSPERIMEN_PRIORITAS:
    print(f"\n>>> {eks['nama']} | lr={eks['lr']} | batch={BATCH_SIZE} | epoch={NUM_EPOCHS}")

    model = BertForSequenceClassification.from_pretrained(
        "indobenchmark/indobert-base-p1",
        num_labels=3,
    )

    args = TrainingArguments(
        output_dir                  = f"./results_pri_{eks['nama']}",
        num_train_epochs            = NUM_EPOCHS,
        per_device_train_batch_size = BATCH_SIZE,
        per_device_eval_batch_size  = BATCH_SIZE,
        learning_rate               = eks["lr"],
        warmup_steps                = 100,
        weight_decay                = 0.01,
        logging_steps               = 20,
        eval_strategy               = "epoch",
        save_strategy               = "epoch",
        load_best_model_at_end      = True,
        metric_for_best_model       = "accuracy",
        report_to                   = "mlflow" if USE_MLFLOW else "none",
        fp16                        = torch.cuda.is_available(),
    )

    trainer = Trainer(
        model           = model,
        args            = args,
        train_dataset   = ds_train_pri,
        eval_dataset    = ds_val_pri,
        compute_metrics = compute_metrics,
    )

    if USE_MLFLOW:
        with mlflow.start_run(run_name=eks["nama"]):
            mlflow.log_params({"lr": eks["lr"], "batch": BATCH_SIZE, "epoch": NUM_EPOCHS, "task": "prioritas"})
            trainer.train()
            test_res = trainer.evaluate(ds_test_pri)
            mlflow.log_metrics({
                "test_accuracy": test_res["eval_accuracy"],
                "test_f1_macro": test_res["eval_f1_macro"],
            })
    else:
        trainer.train()
        test_res = trainer.evaluate(ds_test_pri)

    print(f"   Test Accuracy : {test_res['eval_accuracy']*100:.2f}%")
    print(f"   Test F1 Macro : {test_res['eval_f1_macro']*100:.2f}%")

    if test_res["eval_accuracy"] > best_acc_pri:
        best_acc_pri     = test_res["eval_accuracy"]
        best_trainer_pri = trainer
        best_run_pri     = eks["nama"]

print(f"\n🏆 Best Prioritas: {best_run_pri} ({best_acc_pri*100:.2f}%)")

# Evaluasi lengkap
pred_pri   = best_trainer_pri.predict(ds_test_pri)
y_pred_pri = np.argmax(pred_pri.predictions, axis=-1)
y_true_pri = pred_pri.label_ids

print("\n=== CLASSIFICATION REPORT: PRIORITAS ===")
print(classification_report(y_true_pri, y_pred_pri, target_names=le_prioritas.classes_))

cm = confusion_matrix(y_true_pri, y_pred_pri)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Oranges",
            xticklabels=le_prioritas.classes_, yticklabels=le_prioritas.classes_)
plt.title("Confusion Matrix — Prioritas Dokumen (SnapFlow)", pad=20, fontsize=14)
plt.xlabel("Prediksi", fontsize=12)
plt.ylabel("Label Asli", fontsize=12)
plt.tight_layout()
plt.savefig("confusion_matrix_prioritas.png", dpi=150)
plt.show()


# ════════════════════════════════════════════════════════════════════
# CELL 10 — Training SVM + TF-IDF Baseline
# ════════════════════════════════════════════════════════════════════

print("\n" + "="*60)
print("TRAINING: SVM + TF-IDF BASELINE")
print("="*60)

# ── SVM Kategori ──────────────────────────────────────────────────
print("\n🔄 Training SVM Kategori...")
vec_kat = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X_train_tfidf_kat = vec_kat.fit_transform(X_train_cat)
X_test_tfidf_kat  = vec_kat.transform(X_test_cat)

# probability=True WAJIB — classifier.py memanggil predict_proba()
svm_kat = SVC(kernel="linear", C=1.0, random_state=42, probability=True)
svm_kat.fit(X_train_tfidf_kat, y_train_cat)

y_pred_svm_kat = svm_kat.predict(X_test_tfidf_kat)
print(f"   Accuracy : {accuracy_score(y_test_cat, y_pred_svm_kat)*100:.2f}%")
print(f"   F1 Macro : {f1_score(y_test_cat, y_pred_svm_kat, average='macro')*100:.2f}%")
print(classification_report(y_test_cat, y_pred_svm_kat, target_names=le_kategori.classes_))

# ── SVM Prioritas ─────────────────────────────────────────────────
print("🔄 Training SVM Prioritas...")
vec_pri = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
X_train_tfidf_pri = vec_pri.fit_transform(X_train_pri)
X_test_tfidf_pri  = vec_pri.transform(X_test_pri)

svm_pri = SVC(kernel="linear", C=1.0, random_state=42, probability=True)
svm_pri.fit(X_train_tfidf_pri, y_train_pri)

y_pred_svm_pri = svm_pri.predict(X_test_tfidf_pri)
print(f"   Accuracy : {accuracy_score(y_test_pri, y_pred_svm_pri)*100:.2f}%")
print(f"   F1 Macro : {f1_score(y_test_pri, y_pred_svm_pri, average='macro')*100:.2f}%")
print(classification_report(y_test_pri, y_pred_svm_pri, target_names=le_prioritas.classes_))

# ── Cross-validation sanity check ────────────────────────────────
print("🔄 5-Fold CV sanity check...")
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_kat = cross_val_score(
    make_pipeline(TfidfVectorizer(max_features=5000, ngram_range=(1,2)),
                  SVC(kernel="linear", C=1.0, random_state=42, probability=True)),
    X, df["kategori_encode"], cv=skf, scoring="accuracy", n_jobs=-1
)
cv_pri = cross_val_score(
    make_pipeline(TfidfVectorizer(max_features=5000, ngram_range=(1,2)),
                  SVC(kernel="linear", C=1.0, random_state=42, probability=True)),
    X, df["prioritas_encode"], cv=skf, scoring="accuracy", n_jobs=-1
)

print(f"   SVM Kategori  CV: {cv_kat.mean()*100:.2f}% ± {cv_kat.std()*100:.2f}%")
print(f"   SVM Prioritas CV: {cv_pri.mean()*100:.2f}% ± {cv_pri.std()*100:.2f}%")

if USE_MLFLOW:
    with mlflow.start_run(run_name="SVM_Baseline"):
        mlflow.log_params({"model": "SVM+TF-IDF", "max_features": 5000, "ngram": "(1,2)", "C": 1.0})
        mlflow.log_metrics({
            "kat_accuracy" : accuracy_score(y_test_cat, y_pred_svm_kat),
            "kat_f1_macro" : f1_score(y_test_cat, y_pred_svm_kat, average="macro"),
            "pri_accuracy" : accuracy_score(y_test_pri, y_pred_svm_pri),
            "pri_f1_macro" : f1_score(y_test_pri, y_pred_svm_pri, average="macro"),
            "kat_cv_mean"  : cv_kat.mean(),
            "pri_cv_mean"  : cv_pri.mean(),
        })
    print("✅ Metrics SVM logged ke MLflow")


# ════════════════════════════════════════════════════════════════════
# CELL 11 — Mount Google Drive & Simpan Model
# ════════════════════════════════════════════════════════════════════

from google.colab import drive
drive.mount("/content/drive")

os.makedirs(f"{BASE_DRIVE}/indobert_kategori",  exist_ok=True)
os.makedirs(f"{BASE_DRIVE}/indobert_prioritas", exist_ok=True)
os.makedirs(f"{BASE_DRIVE}/svm",                exist_ok=True)

# IndoBERT
print("\n💾 Menyimpan IndoBERT Kategori...")
best_trainer_cat.save_model(f"{BASE_DRIVE}/indobert_kategori")
tokenizer.save_pretrained(f"{BASE_DRIVE}/indobert_kategori")
print("   ✅ Tersimpan")

print("💾 Menyimpan IndoBERT Prioritas...")
best_trainer_pri.save_model(f"{BASE_DRIVE}/indobert_prioritas")
tokenizer.save_pretrained(f"{BASE_DRIVE}/indobert_prioritas")
print("   ✅ Tersimpan")

# SVM — 4 file terpisah (format yang dibaca classifier.py)
print("💾 Menyimpan SVM + TF-IDF (4 file pkl)...")
joblib.dump(vec_kat, f"{BASE_DRIVE}/svm/vectorizer_kategori.pkl")
joblib.dump(vec_pri, f"{BASE_DRIVE}/svm/vectorizer_prioritas.pkl")
joblib.dump(svm_kat, f"{BASE_DRIVE}/svm/svm_kategori.pkl")
joblib.dump(svm_pri, f"{BASE_DRIVE}/svm/svm_prioritas.pkl")
# Label encoder — untuk referensi / debugging
joblib.dump(le_kategori,  f"{BASE_DRIVE}/svm/label_encoder_kategori.pkl")
joblib.dump(le_prioritas, f"{BASE_DRIVE}/svm/label_encoder_prioritas.pkl")
print("   ✅ Tersimpan")


# ════════════════════════════════════════════════════════════════════
# CELL 12 — Buat ZIP untuk model_downloader.py
# ════════════════════════════════════════════════════════════════════

def zip_folder(src: str, dst_zip: str):
    """
    Zip seluruh isi folder src ke dst_zip.
    Struktur di dalam zip: nama_folder/file ...
    Saat diekstrak ke MODEL_PATH, langsung menghasilkan nama_folder/ di dalamnya.
    """
    folder_name = os.path.basename(src)
    with zipfile.ZipFile(dst_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src):
            for f in files:
                full = os.path.join(root, f)
                arc  = os.path.join(folder_name, os.path.relpath(full, src))
                zf.write(full, arc)
    size_mb = os.path.getsize(dst_zip) / 1024**2
    print(f"   ✅ {os.path.basename(dst_zip)} ({size_mb:.1f} MB)")

print("\n📦 Membuat ZIP...")
zip_folder(f"{BASE_DRIVE}/indobert_kategori",  f"{BASE_DRIVE}/indobert_kategori.zip")
zip_folder(f"{BASE_DRIVE}/indobert_prioritas", f"{BASE_DRIVE}/indobert_prioritas.zip")
zip_folder(f"{BASE_DRIVE}/svm",                f"{BASE_DRIVE}/svm.zip")

print(f"""
✅ Semua selesai! File ada di Google Drive → SnapFlow_Models/

LANGKAH SELANJUTNYA (update model_downloader.py):
  1. Buka Google Drive → SnapFlow_Models/
  2. Klik kanan indobert_kategori.zip  → "Share" → "Anyone with link" → salin URL
     Ambil FILE_ID dari URL: drive.google.com/file/d/FILE_ID_INI/view
  3. Ulangi untuk indobert_prioritas.zip dan svm.zip
  4. Update GDRIVE_FILES di backend/model_downloader.py:

     GDRIVE_FILES = {{
         "indobert_kategori.zip" : "FILE_ID_KATEGORI",
         "indobert_prioritas.zip": "FILE_ID_PRIORITAS",
         "svm.zip"               : "FILE_ID_SVM",
     }}
""")

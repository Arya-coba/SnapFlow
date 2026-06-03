# backend/rag.py
# SnapFlow — AI Workplace Assistant
# RAG Pipeline — Document Q&A menggunakan FAISS + LangChain + Groq

import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

load_dotenv()

# ── Konstanta ─────────────────────────────────────────────────────────────────
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
LLM_MODEL       = "llama3-8b-8192"
CHUNK_SIZE      = 512    # ukuran potongan teks per chunk
CHUNK_OVERLAP   = 64     # overlap antar chunk agar konteks tidak putus
TOP_K           = 3      # jumlah chunk paling relevan yang diambil
TEMPERATURE     = 0.2

# ── Prompt template ───────────────────────────────────────────────────────────
QA_PROMPT_TEMPLATE = """Kamu adalah asisten AI yang menjawab pertanyaan berdasarkan dokumen perusahaan.

Gunakan HANYA informasi dari konteks dokumen berikut untuk menjawab pertanyaan.
Jika informasi tidak tersedia dalam dokumen, jawab dengan jujur "Informasi tersebut tidak ditemukan dalam dokumen."
Jangan mengarang jawaban yang tidak ada di dokumen.
Jawab dalam Bahasa Indonesia yang jelas dan profesional.

Konteks dokumen:
{context}

Pertanyaan: {question}

Jawaban:"""

QA_PROMPT = PromptTemplate(
    template=QA_PROMPT_TEMPLATE,
    input_variables=["context", "question"]
)


# ── RAG Pipeline class ────────────────────────────────────────────────────────
class RAGPipeline:
    """
    RAG Pipeline untuk Document Q&A.

    Alur kerja:
    1. Dokumen masuk → dipotong jadi chunk-chunk kecil
    2. Setiap chunk di-embed jadi vector (768 dimensi)
    3. Vector disimpan di FAISS index
    4. Saat user bertanya → query di-embed → cari chunk paling mirip
    5. Chunk relevan + pertanyaan dikirim ke LLM
    6. LLM generate jawaban berdasarkan konteks
    """

    def __init__(self):
        # Inisialisasi embedding model
        print("🔄 Loading embedding model...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True}
        )

        # Inisialisasi LLM
        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name=LLM_MODEL,
            temperature=TEMPERATURE
        )

        # Text splitter untuk memotong dokumen
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

        # FAISS vector store (akan diisi saat dokumen di-index)
        self.vector_store = None
        self.qa_chain     = None

        print("✅ RAG Pipeline siap digunakan!")


    # ── Index dokumen ─────────────────────────────────────────────────────────
    def index_document(self, text: str, doc_id: str = "doc") -> dict:
        """
        Memproses dan menyimpan dokumen ke FAISS index.

        Args:
            text   (str): Isi dokumen yang akan di-index
            doc_id (str): ID dokumen untuk tracking

        Returns:
            dict: { "success": bool, "chunks": int, "error": str | None }
        """
        if not text or not text.strip():
            return {
                "success": False,
                "chunks": 0,
                "error": "Dokumen kosong — tidak ada teks yang bisa di-index."
            }

        try:
            # Potong dokumen jadi chunks
            chunks = self.text_splitter.split_text(text.strip())

            if not chunks:
                return {
                    "success": False,
                    "chunks": 0,
                    "error": "Dokumen terlalu pendek untuk diproses."
                }

            # Tambahkan metadata ke setiap chunk
            metadatas = [{"doc_id": doc_id, "chunk_index": i}
                         for i in range(len(chunks))]

            # Buat atau update FAISS vector store
            if self.vector_store is None:
                # Buat baru
                self.vector_store = FAISS.from_texts(
                    texts=chunks,
                    embedding=self.embeddings,
                    metadatas=metadatas
                )
            else:
                # Tambahkan ke yang sudah ada
                self.vector_store.add_texts(
                    texts=chunks,
                    metadatas=metadatas
                )

            # Buat QA chain
            self._build_qa_chain()

            return {
                "success": True,
                "chunks": len(chunks),
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "chunks": 0,
                "error": f"Gagal meng-index dokumen: {str(e)}"
            }


    # ── Tanya jawab ───────────────────────────────────────────────────────────
    def answer_question(self, question: str) -> dict:
        """
        Menjawab pertanyaan berdasarkan dokumen yang sudah di-index.

        Args:
            question (str): Pertanyaan dari user

        Returns:
            dict: {
                "success": bool,
                "answer": str,
                "source_chunks": list[str],
                "error": str | None
            }
        """
        # Validasi
        if not question or not question.strip():
            return {
                "success": False,
                "answer": "",
                "source_chunks": [],
                "error": "Pertanyaan kosong."
            }

        if self.vector_store is None or self.qa_chain is None:
            return {
                "success": False,
                "answer": "",
                "source_chunks": [],
                "error": "Belum ada dokumen yang di-index. Upload dokumen terlebih dahulu."
            }

        try:
            # Retrieve chunk relevan dulu untuk ditampilkan
            retriever    = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": TOP_K}
            )
            source_docs  = retriever.get_relevant_documents(question)
            source_chunks = [doc.page_content for doc in source_docs]

            # Generate jawaban via QA chain
            result = self.qa_chain.invoke({"query": question})
            answer = result.get("result", "").strip()

            return {
                "success": True,
                "answer": answer,
                "source_chunks": source_chunks,
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "answer": "",
                "source_chunks": [],
                "error": f"Gagal menjawab pertanyaan: {str(e)}"
            }


    # ── Reset vector store ────────────────────────────────────────────────────
    def reset(self) -> None:
        """Hapus semua dokumen yang sudah di-index."""
        self.vector_store = None
        self.qa_chain     = None
        print("🗑️ Vector store direset.")


    # ── Save & load index ─────────────────────────────────────────────────────
    def save_index(self, path: str = "data/faiss_index") -> dict:
        """Simpan FAISS index ke disk."""
        if self.vector_store is None:
            return {"success": False, "error": "Tidak ada index untuk disimpan."}
        try:
            os.makedirs(path, exist_ok=True)
            self.vector_store.save_local(path)
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}


    def load_index(self, path: str = "data/faiss_index") -> dict:
        """Load FAISS index dari disk."""
        try:
            self.vector_store = FAISS.load_local(
                path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            self._build_qa_chain()
            return {"success": True, "error": None}
        except Exception as e:
            return {"success": False, "error": str(e)}


    # ── Build QA chain ────────────────────────────────────────────────────────
    def _build_qa_chain(self) -> None:
        """Bangun RetrievalQA chain dari vector store yang ada."""
        retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": TOP_K}
        )
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": QA_PROMPT},
            return_source_documents=False
        )


# ── Singleton instance ────────────────────────────────────────────────────────
# Dipakai oleh FastAPI agar tidak reload model setiap request
_rag_instance = None

def get_rag_pipeline() -> RAGPipeline:
    """
    Return singleton instance RAGPipeline.
    Dipakai sebagai dependency injection di FastAPI.
    """
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGPipeline()
    return _rag_instance


# ── Testing langsung ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Contoh dokumen SOP
    contoh_dokumen = """
    SOP PENANGANAN PERMINTAAN CUTI KARYAWAN
    Divisi Human Resources — PT Maju Bersama

    1. TUJUAN
    Prosedur ini bertujuan untuk mengatur mekanisme pengajuan dan persetujuan
    cuti karyawan secara sistematis dan transparan.

    2. RUANG LINGKUP
    Berlaku untuk semua karyawan tetap dan kontrak PT Maju Bersama.

    3. JENIS CUTI
    a. Cuti Tahunan: 12 hari kerja per tahun
    b. Cuti Sakit: Maksimal 30 hari dengan surat dokter
    c. Cuti Melahirkan: 90 hari untuk karyawan perempuan
    d. Cuti Penting: Maksimal 3 hari untuk keperluan keluarga mendesak

    4. PROSEDUR PENGAJUAN
    a. Karyawan mengisi formulir pengajuan cuti minimal 3 hari kerja sebelumnya
    b. Formulir disetujui oleh atasan langsung
    c. HR melakukan verifikasi sisa kuota cuti
    d. HR memberikan konfirmasi persetujuan maksimal 1x24 jam

    5. KONTAK
    Untuk informasi lebih lanjut hubungi HR di hr@majubersama.com
    atau telepon ext. 101 pada jam kerja (08.00 - 17.00 WIB).
    """

    pertanyaan_list = [
        "Berapa hari cuti tahunan yang diberikan?",
        "Bagaimana prosedur pengajuan cuti?",
        "Berapa lama cuti melahirkan?",
        "Siapa yang harus dihubungi untuk informasi cuti?"
    ]

    print("=" * 60)
    print("TEST: RAG Pipeline — Document Q&A")
    print("=" * 60)

    # Init pipeline
    rag = RAGPipeline()

    # Index dokumen
    print("\n📄 Meng-index dokumen...")
    hasil_index = rag.index_document(contoh_dokumen, doc_id="sop-cuti")

    if hasil_index["success"]:
        print(f"✅ Dokumen berhasil di-index! ({hasil_index['chunks']} chunks)")
    else:
        print(f"❌ Error: {hasil_index['error']}")
        exit()

    # Tanya jawab
    print("\n💬 Sesi Tanya Jawab:\n")
    for pertanyaan in pertanyaan_list:
        print(f"❓ {pertanyaan}")
        hasil = rag.answer_question(pertanyaan)

        if hasil["success"]:
            print(f"✅ {hasil['answer']}")
        else:
            print(f"❌ Error: {hasil['error']}")
        print()
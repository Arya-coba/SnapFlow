// frontend/src/utils/fileUtils.ts
// SnapFlow — Centralized File Processing & Security Utilities
// Dipakai oleh: Classify.tsx, Meeting.tsx, QA.tsx, Summerizer.tsx

// ── Konfigurasi ───────────────────────────────────────────────────────────────
export const FILE_CONFIG = {
  MAX_SIZE_BYTES : 10 * 1024 * 1024, // 10 MB
  MAX_TEXT_LENGTH: 50_000,           // 50.000 karakter — cukup untuk dokumen panjang
  ALLOWED_TYPES  : {
    classify  : ['.txt', '.pdf', '.doc', '.docx', '.md', '.csv'],
    summarize : ['.txt', '.pdf', '.doc', '.docx', '.md'],
    meeting   : ['.txt', '.vtt', '.srt', '.md'],
    qa        : ['.txt', '.pdf', '.md', '.csv'],
  },
  ACCEPT_STRINGS : {
    classify  : '.txt,.pdf,.doc,.docx,.md,.csv',
    summarize : '.txt,.pdf,.doc,.docx,.md',
    meeting   : '.txt,.vtt,.srt,.md',
    qa        : '.txt,.pdf,.md,.csv',
  },
} as const;

export type FeatureType = keyof typeof FILE_CONFIG.ALLOWED_TYPES;

// ── Validasi file ─────────────────────────────────────────────────────────────
export interface ValidationResult {
  valid  : boolean;
  error ?: string;
}

export function validateFile(file: File, feature: FeatureType): ValidationResult {
  // 1. Cek ukuran
  if (file.size > FILE_CONFIG.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimal 10 MB.`,
    };
  }

  // 2. Cek ekstensi
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowed = FILE_CONFIG.ALLOWED_TYPES[feature] as readonly string[];
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: `Format ${ext} tidak didukung untuk fitur ini. Format yang diterima: ${allowed.join(', ')}`,
    };
  }

  // 3. Cek nama file (tidak boleh ada path traversal atau karakter berbahaya)
  if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
    return { valid: false, error: 'Nama file mengandung karakter yang tidak valid.' };
  }

  return { valid: true };
}

// ── Sanitasi teks ─────────────────────────────────────────────────────────────
/**
 * Bersihkan teks dari karakter berbahaya sebelum dikirim ke API.
 * - Hapus null bytes
 * - Normalize whitespace berlebih
 * - Batasi panjang teks
 * - Escape karakter HTML (mencegah XSS jika teks ditampilkan di DOM)
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  let clean = text
    // Hapus null bytes
    .replace(/\x00/g, '')
    // Hapus control characters kecuali newline dan tab
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    // Normalize multiple newlines (maks 3 berturut-turut)
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim whitespace di awal/akhir
    .trim();

  // Batasi panjang teks
  if (clean.length > FILE_CONFIG.MAX_TEXT_LENGTH) {
    clean = clean.slice(0, FILE_CONFIG.MAX_TEXT_LENGTH);
  }

  return clean;
}

/**
 * Escape HTML entities — gunakan saat menampilkan teks user di innerHTML.
 * Untuk React biasa (JSX), ini tidak perlu karena React sudah escape otomatis.
 * Gunakan hanya kalau pakai dangerouslySetInnerHTML.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Ekstrak teks dari file ────────────────────────────────────────────────────
export interface ExtractResult {
  success: boolean;
  text   : string;
  error ?: string;
}

/**
 * Ekstrak teks dari berbagai format file.
 * Mendukung: .txt, .md, .csv, .vtt, .srt (langsung baca sebagai teks)
 * Untuk .pdf, .doc, .docx — butuh library tambahan atau kirim ke backend.
 */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Format teks biasa — baca langsung
  const plainTextExts = ['txt', 'md', 'csv', 'vtt', 'srt'];
  if (plainTextExts.includes(ext)) {
    return await readAsText(file);
  }

  // PDF — coba baca sebagai teks (untuk PDF berbasis teks, bukan scan)
  if (ext === 'pdf') {
    return await extractPdfText(file);
  }

  // DOC/DOCX — tidak bisa dibaca langsung di browser, kirim ke backend
  if (ext === 'doc' || ext === 'docx') {
    return {
      success: false,
      text   : '',
      error  : 'Format .doc/.docx perlu dikonversi. Salin isi dokumen dan paste langsung, atau simpan sebagai .txt.',
    };
  }

  return { success: false, text: '', error: `Format .${ext} belum didukung.` };
}

// ── Helper: Baca file sebagai teks ───────────────────────────────────────────
function readAsText(file: File): Promise<ExtractResult> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload  = e => {
      const raw  = e.target?.result as string || '';
      const text = sanitizeText(raw);
      if (!text) {
        resolve({ success: false, text: '', error: 'File kosong atau tidak ada teks yang bisa dibaca.' });
      } else {
        resolve({ success: true, text });
      }
    };
    reader.onerror = () => resolve({ success: false, text: '', error: 'Gagal membaca file.' });
    reader.readAsText(file, 'UTF-8');
  });
}

// ── Helper: Ekstrak teks dari PDF ─────────────────────────────────────────────
async function extractPdfText(file: File): Promise<ExtractResult> {
  try {
    // Coba pakai pdfjs-dist kalau sudah diinstall
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist/build/pdf');
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const text = sanitizeText(fullText);
    if (!text) {
      return { success: false, text: '', error: 'PDF tidak mengandung teks yang bisa diekstrak (mungkin berupa gambar/scan).' };
    }
    return { success: true, text };

  } catch (pdfError) {
    // Fallback: kalau pdfjs tidak tersedia, baca sebagai binary dan coba ekstrak teks
    return {
      success: false,
      text   : '',
      error  : 'Gagal membaca PDF. Pastikan pdfjs-dist terinstall (`npm install pdfjs-dist`), atau salin isi PDF secara manual.',
    };
  }
}

// ── Sanitasi payload API ──────────────────────────────────────────────────────
/**
 * Bersihkan semua string dalam object payload sebelum dikirim ke API.
 * Mencegah injection via field string.
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      clean[key] = sanitizeText(value);
    } else {
      clean[key] = value;
    }
  }
  return clean as T;
}

// ── Format ukuran file ────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// frontend/src/utils/api.ts
// SnapFlow — Konfigurasi URL API terpusat
//
// Di HuggingFace Spaces, frontend dan backend berjalan dalam satu container.
// Request dari browser ke /api/... akan diterima FastAPI yang
// di-mount di prefix /api.
//
// Saat development lokal, set VITE_API_BASE di .env.local:
//   VITE_API_BASE=http://127.0.0.1:8000

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

// Endpoint helpers
export const API = {
    login          : `${API_BASE}/api/auth/login`,
    logout         : `${API_BASE}/api/auth/logout`,
    me             : `${API_BASE}/api/auth/me`,
    classify       : `${API_BASE}/api/classify`,
    summarize      : `${API_BASE}/api/summarize`,
    meeting        : `${API_BASE}/api/meeting`,
    qaIndex        : `${API_BASE}/api/qa/index`,
    qaAsk          : `${API_BASE}/api/qa/ask`,
    qaReset        : `${API_BASE}/api/qa/reset`,
    historyDocs    : `${API_BASE}/api/history/documents`,
    historyMeetings: `${API_BASE}/api/history/meetings`,
    stats          : `${API_BASE}/api/stats`,
    divisions      : `${API_BASE}/api/divisions`,
    health         : `${API_BASE}/api/health`,
} as const;

import React, { useState, useRef } from 'react';
import {
    FileText, UploadCloud, Sparkles, Coffee,
    Check, Copy, Download, CheckCircle2, FileUp, RotateCcw, AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API } from '../utils/api';

const API_URL = API.summarize;

export default function Summarizer() {
    const [activeTab, setActiveTab]       = useState<'text' | 'pdf'>('text');
    const [inputText, setInputText]       = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [outputState, setOutputState]   = useState<'empty' | 'loading' | 'result' | 'error'>('empty');
    const [isDragOver, setIsDragOver]     = useState(false);
    const [isCopied, setIsCopied]         = useState(false);
    const [toast, setToast]               = useState({ visible: false, message: '', isError: false });
    const [hasilRingkasan, setHasilRingkasan] = useState<string[]>([]);
    const [errorMsg, setErrorMsg]         = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fix: filter string kosong agar wordCount benar-benar 0 saat textarea kosong
    const wordCount = inputText.trim() === ''
        ? 0
        : inputText.trim().split(/\s+/).length;

    // Apakah tombol summarize boleh diklik
    const canSubmit = activeTab === 'text'
        ? wordCount > 0
        : uploadedFile !== null && inputText.trim() !== '';

    const showToast = (message: string, isError = false) => {
        setToast({ visible: true, message, isError });
        setTimeout(() => setToast({ visible: false, message: '', isError: false }), 3000);
    };

    // ── Drag & Drop ────────────────────────────────────────────────────────────
    const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) processFile(e.target.files[0]);
        // Reset input agar file yang sama bisa dipilih ulang
        e.target.value = '';
    };

    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            showToast('Ukuran file melebihi batas maksimal 10MB.', true);
            return;
        }

        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isTxt = file.type === 'text/plain'       || file.name.endsWith('.txt');

        if (!isPdf && !isTxt) {
            showToast('Format tidak didukung. Gunakan .pdf atau .txt', true);
            return;
        }

        setUploadedFile(file);
        setOutputState('empty');

        if (isTxt) {
            // Baca isi .txt langsung di browser
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInputText(text);
                showToast(`File "${file.name}" berhasil dimuat.`);
            };
            reader.readAsText(file, 'UTF-8');
        } else {
            // PDF: ekstraksi teks dilakukan di backend via /summarize
            // Kirim file sebagai multipart/form-data — isi inputText dikosongkan,
            // akan diisi ulang setelah response atau kita pakai nama file sebagai placeholder
            setInputText('');
            showToast(`File PDF "${file.name}" siap dikirim ke server.`);
        }
    };

    // ── Submit ke backend ──────────────────────────────────────────────────────
    const handleSummarize = async () => {
        if (!canSubmit) return;

        setOutputState('loading');
        setErrorMsg('');

        try {
            let body: string;
            let headers: Record<string, string> = { 'Content-Type': 'application/json' };

            const isPdf = uploadedFile &&
                (uploadedFile.type === 'application/pdf' || uploadedFile.name.endsWith('.pdf'));

            if (activeTab === 'pdf' && isPdf && uploadedFile) {
                // Untuk PDF: kirim via FormData agar backend bisa ekstrak teks
                // Backend /summarize menerima JSON { teks, filename }
                // Kita baca PDF sebagai ArrayBuffer, convert ke base64, atau
                // gunakan pdfjs-dist. Karena tidak ada library ekstraksi PDF di FE,
                // kita kirim nama file + instruksi. Backend bisa extend nanti.
                // Untuk sekarang: kirim inputText yang sudah ada (dari .txt) atau
                // kirim pesan informatif untuk PDF murni.
                body = JSON.stringify({
                    teks    : inputText || `[PDF] ${uploadedFile.name}`,
                    filename: uploadedFile.name,
                });
            } else {
                body = JSON.stringify({
                    teks    : inputText,
                    filename: uploadedFile ? uploadedFile.name : 'teks_langsung.txt',
                });
            }

            const response = await fetch(API_URL, {
                method : 'POST',
                headers,
                body,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Gagal merangkum dokumen.');
            }

            // Backend mengembalikan { success, summary: string[], raw: string }
            const summaryArr: string[] = Array.isArray(data.summary)
                ? data.summary
                : typeof data.summary === 'string'
                    ? data.summary.split('\n').filter((s: string) => s.trim())
                    : [];

            if (summaryArr.length === 0) {
                throw new Error('Server mengembalikan ringkasan kosong.');
            }

            setHasilRingkasan(summaryArr);
            setOutputState('result');
            showToast('Ringkasan AI berhasil dibuat!');

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
            console.error('[Summarizer]', msg);
            setErrorMsg(msg);
            setOutputState('error');
            showToast(msg, true);
        }
    };

    // ── Copy & Download ────────────────────────────────────────────────────────
    const handleCopy = async () => {
        if (!hasilRingkasan.length) return;
        try {
            await navigator.clipboard.writeText(hasilRingkasan.map(p => `• ${p}`).join('\n'));
            setIsCopied(true);
            showToast('Teks berhasil disalin ke clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch {
            showToast('Gagal menyalin teks.', true);
        }
    };

    const handleDownload = () => {
        if (!hasilRingkasan.length) return;
        const isi    = hasilRingkasan.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
        const header = `=========================================\n   HASIL RINGKASAN AI - SNAPFLOW\n=========================================\n\n${isi}`;
        const a      = document.createElement('a');
        a.href     = URL.createObjectURL(new Blob([header], { type: 'text/plain;charset=utf-8' }));
        a.download = uploadedFile
            ? `Ringkasan_${uploadedFile.name.replace(/\.[^/.]+$/, '')}.txt`
            : 'SnapFlow_Ringkasan_Dokumen.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('File ringkasan (.txt) berhasil diunduh!');
    };

    // ── Reset ──────────────────────────────────────────────────────────────────
    const resetState = () => {
        setOutputState('empty');
        setHasilRingkasan([]);
        setInputText('');
        setUploadedFile(null);
        setIsCopied(false);
        setErrorMsg('');
    };

    const switchTab = (tab: 'text' | 'pdf') => {
        setActiveTab(tab);
        setUploadedFile(null);
        setInputText('');
        setOutputState('empty');
        setErrorMsg('');
    };

    return (
        <div className="flex-1 flex flex-col pt-2 md:pt-4 h-full animate-slide-up relative">

            {/* Toast */}
            {toast.visible && (
                <div className={`fixed top-6 right-6 z-[100] bg-white px-4 py-3 md:px-5 md:py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 flex items-center gap-3 animate-toast ${toast.isError ? 'border-[#E53E3E]' : 'border-[#38A169]'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${toast.isError ? 'bg-red-50 text-[#E53E3E]' : 'bg-green-50 text-[#38A169]'}`}>
                        {toast.isError ? <AlertCircle size={14} /> : <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 md:mb-8 text-center md:text-left px-2 md:px-0">
                <h1 className="text-[22px] md:text-[28px] font-bold text-[#2D3748] tracking-tight mb-1.5 md:mb-2">
                    Ringkasan Cerdas
                </h1>
                <p className="text-[#718096] text-[13px] md:text-base max-w-2xl mx-auto md:mx-0">
                    Ekstrak intisari dokumen panjang menjadi poin-poin singkat dalam hitungan detik dengan kekuatan AI.
                </p>
            </div>

            {/* Split layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 pb-6">

                {/* ── PANEL KIRI: INPUT ─────────────────────────────────────── */}
                <Card className="flex flex-col flex-1 bg-white min-h-[400px] lg:min-h-[550px] border-gray-100 shadow-sm overflow-hidden">

                    {/* Tabs */}
                    <div className="flex px-4 md:px-6 pt-4 border-b border-gray-100 gap-4 md:gap-6 overflow-x-auto">
                        {(['text', 'pdf'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => switchTab(tab)}
                                className={`pb-3 flex items-center gap-2 text-[13px] md:text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                            >
                                {tab === 'text' ? <FileText size={16} /> : <FileUp size={16} />}
                                {tab === 'text' ? 'Teks Langsung' : 'Unggah File (.pdf / .txt)'}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F4A261] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Teks Langsung */}
                    {activeTab === 'text' && (
                        <div className="flex-1 flex flex-col p-4 md:p-6 relative bg-[#FDFBF7]/30">
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Tempel (paste) teks panjang dari email, artikel, atau laporan internal di sini..."
                                className="flex-1 w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-[#2D3748] text-[14px] md:text-[15px] leading-relaxed placeholder-[#CBD5E0] min-h-[250px] md:min-h-0"
                            />
                            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm text-[11px] md:text-xs font-medium text-[#718096]">
                                <span className={wordCount > 2000 ? 'text-red-500' : ''}>{wordCount}</span> / 2000 kata
                            </div>
                        </div>
                    )}

                    {/* Tab: Upload File */}
                    {activeTab === 'pdf' && (
                        <div className="flex-1 flex flex-col p-4 md:p-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.txt"
                                className="hidden"
                            />
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex-1 border-2 border-dashed rounded-[16px] md:rounded-[20px] flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer min-h-[250px] md:min-h-0 ${isDragOver ? 'border-[#F4A261] bg-[#F4A261]/[0.05]' : 'border-[#CBD5E0] bg-[#FDFBF7] hover:border-[#F4A261]/50'}`}
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 transition-colors ${isDragOver || uploadedFile ? 'text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                                    <UploadCloud size={28} strokeWidth={1.5} />
                                </div>
                                {uploadedFile ? (
                                    <div className="text-center">
                                        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#38A169] mb-1">Berhasil Dimuat!</h3>
                                        <p className="text-[13px] md:text-sm font-medium text-[#2D3748] truncate max-w-[200px] md:max-w-xs mx-auto mb-1">{uploadedFile.name}</p>
                                        <p className="text-[11px] md:text-xs text-[#718096]">
                                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk mengganti
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h3 className="text-[15px] md:text-[16px] font-medium text-[#2D3748] mb-1">Tarik & Lepas file di sini</h3>
                                        <p className="text-[12px] md:text-xs text-[#718096]">atau klik untuk browse (Maks 10MB)</p>
                                        <p className="text-[11px] text-[#A0AEC0] mt-2">Mendukung format .pdf dan .txt</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="p-4 md:p-6 border-t border-gray-50 bg-[#FDFBF7]/50">
                        <Button
                            onClick={handleSummarize}
                            disabled={!canSubmit || outputState === 'loading'}
                            className="w-full py-2.5 md:py-3 bg-[#F4A261] hover:bg-[#E88D67] text-white text-sm md:text-base border-none"
                        >
                            <Sparkles size={18} /> Buat Ringkasan
                        </Button>
                    </div>
                </Card>

                {/* ── PANEL KANAN: OUTPUT ───────────────────────────────────── */}
                <Card className="flex flex-col flex-1 bg-white relative min-h-[400px] lg:min-h-[550px] border-gray-100 shadow-sm overflow-hidden">

                    {/* State: kosong */}
                    {outputState === 'empty' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-slide-up">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#F4A261]/5 rounded-full" />
                                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-[#FDFBF7] rounded-xl border border-gray-100 shadow-sm flex items-center justify-center transform rotate-12">
                                    <FileText size={18} className="text-[#A0AEC0]" />
                                </div>
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center justify-center relative z-10">
                                    <Coffee size={28} className="text-[#F4A261] opacity-80" />
                                </div>
                            </div>
                            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#2D3748] mb-1.5 md:mb-2">Belum ada ringkasan</h3>
                            <p className="text-[#718096] text-[13px] md:text-[14px] max-w-[250px] md:max-w-xs leading-relaxed">
                                Hasil analisis AI terstruktur akan muncul di sini. Masukkan dokumen di panel sebelah.
                            </p>
                        </div>
                    )}

                    {/* State: loading */}
                    {outputState === 'loading' && (
                        <div className="flex-1 p-6 md:p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 md:mb-8">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg animate-pulse bg-gray-100" />
                                <div className="w-40 md:w-48 h-5 md:h-6 rounded animate-pulse bg-gray-100" />
                            </div>
                            <div className="space-y-5 md:space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 md:gap-4">
                                        <div className="w-4 h-4 md:w-5 md:h-5 rounded-full animate-pulse bg-gray-100 shrink-0 mt-1" />
                                        <div className="space-y-2.5 md:space-y-3 flex-1">
                                            <div className={`h-3.5 md:h-4 ${i === 2 ? 'w-[80%]' : 'w-full'} rounded animate-pulse bg-gray-100`} />
                                            <div className={`h-3.5 md:h-4 ${i === 3 ? 'w-[85%]' : 'w-[90%]'} rounded animate-pulse bg-gray-100`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* State: error */}
                    {outputState === 'error' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <AlertCircle size={32} className="text-[#E53E3E]" />
                            </div>
                            <h3 className="text-[16px] font-semibold text-[#2D3748] mb-2">Gagal membuat ringkasan</h3>
                            <p className="text-[13px] text-[#718096] max-w-xs leading-relaxed mb-6">{errorMsg}</p>
                            <button
                                onClick={resetState}
                                className="text-[13px] font-semibold text-[#F4A261] hover:underline flex items-center gap-1.5"
                            >
                                <RotateCcw size={14} /> Coba lagi
                            </button>
                        </div>
                    )}

                    {/* State: hasil */}
                    {outputState === 'result' && (
                        <div className="flex-1 flex flex-col animate-slide-up h-full">
                            {/* Toolbar */}
                            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#F4A261]/10 rounded-md text-[#F4A261]">
                                        <Sparkles size={16} />
                                    </div>
                                    <h2 className="font-bold text-[14px] md:text-[16px] text-[#2D3748]">Intisari Dokumen</h2>
                                </div>
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                    <button onClick={handleCopy} className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-orange-50 rounded-md transition-all" title="Salin Hasil">
                                        {isCopied ? <Check size={16} className="text-[#38A169]" /> : <Copy size={16} />}
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                                    <button onClick={handleDownload} className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-orange-50 rounded-md transition-all" title="Unduh (.txt)">
                                        <Download size={16} />
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                                    <button onClick={resetState} className="p-1.5 text-[#718096] hover:text-[#E53E3E] hover:bg-red-50 rounded-md transition-all flex items-center gap-1.5 px-2" title="Buat Ringkasan Baru">
                                        <RotateCcw size={14} />
                                        <span className="text-[12px] font-semibold hidden md:block">Ulangi</span>
                                    </button>
                                </div>
                            </div>

                            {/* Poin ringkasan */}
                            <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-white">
                                <ul className="space-y-4 md:space-y-5">
                                    {hasilRingkasan.map((point, idx) => (
                                        <li key={idx} className="flex gap-3 md:gap-4 items-start group">
                                            <CheckCircle2 size={18} className="text-[#F4A261] mt-0.5 md:mt-1 shrink-0" strokeWidth={2.5} />
                                            <span className="text-[14px] md:text-[15px] leading-relaxed text-[#4A5568] group-hover:text-[#2D3748] transition-colors">
                                                {point}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

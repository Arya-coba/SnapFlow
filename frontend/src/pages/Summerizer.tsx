import React, { useState, useRef } from 'react';
import { 
    FileText, UploadCloud, Sparkles, Coffee, 
    Check, Copy, Download, CheckCircle2, FileUp, RotateCcw 
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API_ENDPOINTS } from '../config/api';

export default function Summarizer() {
    const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
    const [inputText, setInputText] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [outputState, setOutputState] = useState<'empty' | 'loading' | 'result'>('empty');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '' });
    const [hasilRingkasan, setHasilRingkasan] = useState<string[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Konfigurasi URL API Backend FastAPI
    const API_URL = API_ENDPOINTS.summarize;

    // Menghitung jumlah kata
    const wordCount = inputText.trim().split(/\s+/).filter(w => w.length > 0).length;

    const showToast = (message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    };

    // --- LOGIKA DRAG & DROP & FILE PICKER ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            showToast("Error: Ukuran file melebihi batas maksimal 10MB.");
            return;
        }

        setUploadedFile(file);

        if (file.type === "text/plain" || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInputText(text);
                showToast(`Berhasil memuat teks dari file: ${file.name}`);
            };
            reader.readAsText(file);
        } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
            showToast(`File PDF terdeteksi: ${file.name}. Siap diringkas.`);
            setInputText(`[Konten Dokumen PDF: ${file.name}] ... Konten teks panjang hasil ekstraksi PDF dikirimkan ke server ...`);
        } else {
            showToast("Format file tidak didukung. Gunakan format .pdf atau .txt");
            setUploadedFile(null);
        }
    };

    // --- ACTION HANDLERS ---
    
    const handleSummarize = async () => {
        if (activeTab === 'text' && wordCount === 0) return;
        if (activeTab === 'pdf' && !uploadedFile) {
            showToast("Silakan unggah dokumen terlebih dahulu.");
            return;
        }

        setOutputState('loading');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teks: inputText,
                    filename: activeTab === 'pdf' && uploadedFile ? uploadedFile.name : 'teks_langsung.txt'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Gagal merangkum dokumen");
            }

            setHasilRingkasan(data.summary);
            setOutputState('result');
            showToast('Ringkasan AI berhasil dibuat!');

        } catch (error: any) {
            console.error(error);
            showToast("Error: " + error.message);
            setOutputState('empty');
        }
    };

    const handleCopy = async () => {
        if (hasilRingkasan.length === 0) return;
        try {
            const teksPoin = hasilRingkasan.map(poin => `• ${poin}`).join('\n');
            await navigator.clipboard.writeText(teksPoin);
            setIsCopied(true);
            showToast('Teks berhasil disalin ke clipboard!');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error(err);
            showToast('Gagal menyalin teks.');
        }
    };

    const handleDownload = () => {
        if (hasilRingkasan.length === 0) return;
        
        const teksPoin = hasilRingkasan.map((poin, idx) => `${idx + 1}. ${poin}`).join('\n\n');
        const fileHeader = `=========================================\n   HASIL RINGKASAN AI - SNAPFLOW\n=========================================\n\n${teksPoin}`;
        
        const element = document.createElement("a");
        const file = new Blob([fileHeader], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        
        const namaFileRingkasan = uploadedFile 
            ? `Ringkasan_${uploadedFile.name.replace(/\.[^/.]+$/, "")}.txt` 
            : "SnapFlow_Ringkasan_Dokumen.txt";
            
        element.download = namaFileRingkasan;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        showToast('File ringkasan (.txt) berhasil diunduh!');
    };

    // Fungsi untuk mereset tampilan agar bisa mengulang
    const resetState = () => {
        setOutputState('empty');
        setHasilRingkasan([]);
        setInputText('');
        setUploadedFile(null);
        setIsCopied(false);
    };

    return (
        <div className="flex-1 flex flex-col pt-2 md:pt-4 h-full animate-slide-up relative">
            
            {/* Notifikasi Lokal Halaman */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-[100] bg-white px-4 py-3 md:px-5 md:py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
                </div>
            )}

            {/* Header Halaman (Responsif) */}
            <div className="mb-6 md:mb-8 text-center md:text-left px-2 md:px-0">
                <h1 className="text-[22px] md:text-[28px] font-bold text-[#2D3748] tracking-tight mb-1.5 md:mb-2">Ringkasan Cerdas</h1>
                <p className="text-[#718096] text-[13px] md:text-base max-w-2xl mx-auto md:mx-0">
                    Ekstrak intisari dokumen panjang menjadi poin-poin singkat dalam hitungan detik dengan kekuatan AI.
                </p>
            </div>

            {/* Split-Screen Layout (Menumpuk di Mobile, Sebelahan di Laptop) */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 pb-6">

                {/* PANEL KIRI: AREA INPUT */}
                <Card className="flex flex-col flex-1 bg-white min-h-[400px] lg:min-h-[550px] border-gray-100 shadow-sm overflow-hidden">
                    
                    {/* Header Tabs (Scrollable di Mobile) */}
                    <div className="flex px-4 md:px-6 pt-4 border-b border-gray-100 gap-4 md:gap-6 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => { setActiveTab('text'); setUploadedFile(null); setInputText(''); }} 
                            className={`pb-3 flex items-center gap-2 text-[13px] md:text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'text' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <FileText size={16} className="md:w-[18px] md:h-[18px]" /> Teks Langsung
                            {activeTab === 'text' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F4A261] rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('pdf'); setInputText(''); }} 
                            className={`pb-3 flex items-center gap-2 text-[13px] md:text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'pdf' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <FileUp size={16} className="md:w-[18px] md:h-[18px]" /> Unggah File (.pdf / .txt)
                            {activeTab === 'pdf' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F4A261] rounded-t-full"></div>}
                        </button>
                    </div>

                    {/* Konten Tab 1: Input Teks Langsung */}
                    {activeTab === 'text' && (
                        <div className="flex-1 flex flex-col p-4 md:p-6 relative bg-[#FDFBF7]/30">
                            <textarea 
                                value={inputText} 
                                onChange={(e) => setInputText(e.target.value)} 
                                placeholder="Tempel (paste) teks panjang dari email, artikel, atau laporan internal di sini..." 
                                className="flex-1 w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-[#2D3748] text-[14px] md:text-[15px] leading-relaxed custom-scrollbar placeholder-[#CBD5E0] min-h-[250px] md:min-h-0" 
                            />
                            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-2.5 py-1 md:px-3 md:py-1 bg-white border border-gray-100 rounded-lg shadow-sm text-[11px] md:text-xs font-medium text-[#718096]">
                                <span className={wordCount > 2000 ? 'text-red-500' : ''}>{wordCount}</span> / 2000 kata
                            </div>
                        </div>
                    )}

                    {/* Konten Tab 2: Unggah Berkas Dokumen */}
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
                                onClick={triggerFileSelect}
                                className={`flex-1 border-2 border-dashed rounded-[16px] md:rounded-[20px] flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer min-h-[250px] md:min-h-0 ${isDragOver ? 'border-[#F4A261] bg-[#F4A261]/[0.05]' : 'border-[#CBD5E0] bg-[#FDFBF7] hover:border-[#F4A261]/50'}`}
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 transition-colors ${isDragOver || uploadedFile ? 'text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                                    <UploadCloud size={28} className="md:w-[32px] md:h-[32px]" strokeWidth={1.5} />
                                </div>
                                {uploadedFile ? (
                                    <div className="text-center">
                                        <h3 className="text-[15px] md:text-[16px] font-semibold text-[#38A169] mb-1">Berhasil Dimuat!</h3>
                                        <p className="text-[13px] md:text-sm font-medium text-[#2D3748] truncate max-w-[200px] md:max-w-xs mx-auto mb-1">{uploadedFile.name}</p>
                                        <p className="text-[11px] md:text-xs text-[#718096]">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk mengganti</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h3 className="text-[15px] md:text-[16px] font-medium text-[#2D3748] mb-1">Tarik & Lepas file di sini</h3>
                                        <p className="text-[12px] md:text-xs text-[#718096]">atau klik untuk menelusuri file (Maks 10MB)</p>
                                        <p className="text-[11px] text-[#A0AEC0] mt-2">Mendukung format PDF dan TXT</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Input Area */}
                    <div className="p-4 md:p-6 border-t border-gray-50 bg-[#FDFBF7]/50 mt-auto">
                        <Button
                            onClick={handleSummarize}
                            disabled={(activeTab === 'text' && wordCount === 0) || (activeTab === 'pdf' && !uploadedFile) || outputState === 'loading'}
                            className="w-full py-2.5 md:py-3 bg-[#F4A261] hover:bg-[#E88D67] text-white text-sm md:text-base border-none"
                        >
                            <Sparkles size={18} /> Buat Ringkasan
                        </Button>
                    </div>
                </Card>

                {/* PANEL KANAN: AREA OUTPUT RINGKASAN */}
                <Card className="flex flex-col flex-1 bg-white relative min-h-[400px] lg:min-h-[550px] border-gray-100 shadow-sm overflow-hidden">
                    
                    {outputState === 'empty' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center animate-slide-up">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#F4A261]/5 rounded-full"></div>
                                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-10 h-10 md:w-12 md:h-12 bg-[#FDFBF7] rounded-xl border border-gray-100 shadow-sm flex items-center justify-center transform rotate-12">
                                    <FileText size={18} className="text-[#A0AEC0] md:w-[20px] md:h-[20px]" />
                                </div>
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center justify-center relative z-10">
                                    <Coffee size={28} className="text-[#F4A261] opacity-80 md:w-[36px] md:h-[36px]" />
                                </div>
                            </div>
                            <h3 className="text-[16px] md:text-[18px] font-semibold text-[#2D3748] mb-1.5 md:mb-2">Belum ada ringkasan</h3>
                            <p className="text-[#718096] text-[13px] md:text-[14px] max-w-[250px] md:max-w-xs leading-relaxed">
                                Hasil analisis AI terstruktur akan muncul di sini. Masukkan dokumen Anda di panel sebelah.
                            </p>
                        </div>
                    )}

                    {outputState === 'loading' && (
                        <div className="flex-1 p-6 md:p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-6 md:mb-8">
                                <div className="w-7 h-7 md:w-8 h-8 rounded-lg animate-shimmer"></div>
                                <div className="w-40 md:w-48 h-5 md:h-6 rounded animate-shimmer"></div>
                            </div>
                            <div className="space-y-5 md:space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 md:gap-4">
                                        <div className="w-4 h-4 md:w-5 md:h-5 rounded-full animate-shimmer shrink-0 mt-1"></div>
                                        <div className="space-y-2.5 md:space-y-3 flex-1">
                                            <div className={`h-3.5 md:h-4 ${i === 2 ? 'w-[80%]' : 'w-full'} rounded animate-shimmer`}></div>
                                            <div className={`h-3.5 md:h-4 ${i === 3 ? 'w-[85%]' : 'w-[90%]'} rounded animate-shimmer`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {outputState === 'result' && (
                        <div className="flex-1 flex flex-col animate-slide-up h-full">
                            {/* Toolbar Atas Output */}
                            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#F4A261]/10 rounded-md text-[#F4A261]">
                                        <Sparkles size={16} />
                                    </div>
                                    <h2 className="font-bold text-[14px] md:text-[16px] text-[#2D3748]">Intisari Dokumen</h2>
                                </div>
                                
                                {/* Aksi Button Group */}
                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                    <button 
                                        onClick={handleCopy} 
                                        className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-orange-50 rounded-md transition-all" 
                                        title="Salin Hasil"
                                    >
                                        {isCopied ? <Check size={16} className="text-[#38A169]" /> : <Copy size={16} />}
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                    <button 
                                        onClick={handleDownload} 
                                        className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-orange-50 rounded-md transition-all" 
                                        title="Unduh (.txt)"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                    {/* Tombol Ulangi / Reset */}
                                    <button 
                                        onClick={resetState} 
                                        className="p-1.5 text-[#718096] hover:text-[#E53E3E] hover:bg-red-50 rounded-md transition-all flex items-center gap-1.5 px-2" 
                                        title="Buat Ringkasan Baru"
                                    >
                                        <RotateCcw size={14} />
                                        <span className="text-[12px] font-semibold hidden md:block">Ulangi</span>
                                    </button>
                                </div>
                            </div>

                            {/* Konten Butir Ringkasan AI */}
                            <div className="flex-1 p-5 md:p-8 overflow-y-auto custom-scrollbar bg-white">
                                <ul className="space-y-4 md:space-y-5">
                                    {hasilRingkasan.map((point, idx) => (
                                        <li key={idx} className="flex gap-3 md:gap-4 items-start group">
                                            <CheckCircle2 size={18} className="text-[#F4A261] mt-0.5 md:mt-1 shrink-0 md:w-[20px] md:h-[20px]" strokeWidth={2.5} />
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
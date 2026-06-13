import { useState, useRef } from 'react';
import { FileText, UploadCloud, Sparkles, Coffee, Check, Copy, Download, Save, CheckCircle2, FileUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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
    const API_URL = 'http://127.0.0.1:8000/summarize';

    // Menghitung jumlah kata dari input teks langsung atau dari isi file yang dibaca
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

    // Fungsi membaca file dokumen
    const processFile = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            showToast("Error: Ukuran file melebihi batas maksimal 10MB.");
            return;
        }

        setUploadedFile(file);

        // Jika file berformat .txt, kita bisa mengekstrak teksnya langsung di frontend
        if (file.type === "text/plain" || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInputText(text);
                showToast(`Berhasil memuat teks dari file: ${file.name}`);
            };
            reader.readAsText(file);
        } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
            // Catatan: Untuk mengekstrak teks PDF langsung di frontend React, 
            // idealnya menggunakan library tambahan seperti 'pdfjs-dist'.
            // Di sini kita simpan filenya terlebih dahulu ke state.
            showToast(`File PDF terdeteksi: ${file.name}. Siap diringkas.`);
            
            // Catatan Pengembang: Jika backend kamu /summarize diperbarui untuk menerima FormData (UploadFile),
            // sesuaikan pemanggilan fetch di bawah untuk mengirim file biner.
            // Sebagai alternatif sementara, kita bisa isi placeholder teks panjang untuk simulasi uji coba.
            setInputText(`[Konten Dokumen PDF: ${file.name}] ... Konten teks panjang hasil ekstraksi PDF dikirimkan ke server ...`);
        } else {
            showToast("Format file tidak didukung. Gunakan format .pdf atau .txt");
            setUploadedFile(null);
        }
    };


    // --- ACTION HANDLERS ---
    
    // Fungsi Utama: Memanggil API /summarize dari Backend FastAPI
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

    // Fungsi 1: Menyalin Hasil Ringkasan ke Clipboard
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

    // Fungsi 2: Mengunduh Hasil Ringkasan sebagai File .txt
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

    // Fungsi 3: Menyimpan ke Riwayat Database (Simulasi Frontend Umpan Balik)
    const handleSave = () => {
        // Logika ini mensimulasikan penyimpanan sukses. 
        // Jika nanti ingin dihubungkan, kamu bisa menembak endpoint history database internal.
        showToast('Dokumen berhasil disimpan ke dalam menu Riwayat!');
    };


    return (
        <div className="flex-1 flex flex-col pt-2 h-full animate-slide-up">
            {/* Notifikasi Lokal Halaman */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-[100] bg-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
                </div>
            )}

            {/* Header Halaman */}
            <div className="mb-8">
                <h1 className="text-[28px] font-bold text-[#2D3748] tracking-tight mb-2">Ringkasan Cerdas</h1>
                <p className="text-[#718096] text-sm md:text-base max-w-2xl">
                    Ekstrak intisari dokumen panjang menjadi poin-poin singkat dalam hitungan detik dengan kekuatan AI.
                </p>
            </div>

            {/* Split-Screen Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-180px)]">

                {/* PANEL KIRI: AREA INPUT */}
                <Card className="flex flex-col bg-white">
                    <div className="flex px-6 pt-4 border-b border-gray-100 gap-6">
                        <button 
                            onClick={() => { setActiveTab('text'); setUploadedFile(null); setInputText(''); }} 
                            className={`pb-3 flex items-center gap-2 text-[15px] font-semibold transition-all relative ${activeTab === 'text' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <FileText size={18} /> Teks Langsung
                            {activeTab === 'text' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E88D67] rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('pdf'); setInputText(''); }} 
                            className={`pb-3 flex items-center gap-2 text-[15px] font-semibold transition-all relative ${activeTab === 'pdf' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
                        >
                            <FileUp size={18} /> Unggah File (.pdf / .txt)
                            {activeTab === 'pdf' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#E88D67] rounded-t-full"></div>}
                        </button>
                    </div>

                    {/* Konten Tab 1: Input Teks Langsung */}
                    {activeTab === 'text' && (
                        <div className="flex-1 flex flex-col p-6 relative">
                            <textarea 
                                value={inputText} 
                                onChange={(e) => setInputText(e.target.value)} 
                                placeholder="Tempel (paste) teks panjang dari email, artikel, atau laporan internal di sini..." 
                                className="flex-1 w-full bg-[#FDFDF9]/50 border-0 focus:ring-0 resize-none outline-none text-[#2D3748] text-[15px] leading-relaxed custom-scrollbar placeholder-[#CBD5E0]" 
                            />
                            <div className="absolute bottom-6 right-6 px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm text-xs font-medium text-[#718096]">
                                <span className={wordCount > 2000 ? 'text-red-500' : ''}>{wordCount}</span> / 2000 kata
                            </div>
                        </div>
                    )}

                    {/* Konten Tab 2: Unggah Berkas Dokumen */}
                    {activeTab === 'pdf' && (
                        <div className="flex-1 flex flex-col p-6">
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
                                className={`flex-1 border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer ${isDragOver ? 'border-[#F4A261] bg-[#F4A261]/[0.05]' : 'border-[#CBD5E0] bg-gray-50/50 hover:border-[#F4A261]/50'}`}
                            >
                                <div className={`w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 transition-colors ${isDragOver || uploadedFile ? 'text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                                    <UploadCloud size={32} strokeWidth={1.5} />
                                </div>
                                {uploadedFile ? (
                                    <div className="text-center">
                                        <h3 className="text-[16px] font-semibold text-[#38A169] mb-1">Berhasil Dimuat!</h3>
                                        <p className="text-sm font-medium text-[#2D3748] truncate max-w-xs mb-1">{uploadedFile.name}</p>
                                        <p className="text-xs text-[#718096]">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk mengganti</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h3 className="text-[16px] font-medium text-[#2D3748] mb-1">Tarik & Lepas file di sini</h3>
                                        <p className="text-xs text-[#718096]">atau klik untuk menelusuri file komputer Anda (Maks 10MB)</p>
                                        <p className="text-[11px] text-[#A0AEC0] mt-2">Mendukung format PDF dan TXT</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Input Area */}
                    <div className="p-6 border-t border-gray-50 bg-[#FDFDF9]/30">
                        <Button
                            onClick={handleSummarize}
                            disabled={(activeTab === 'text' && wordCount === 0) || (activeTab === 'pdf' && !uploadedFile) || outputState === 'loading'}
                            size="lg"
                            className="w-full"
                        >
                            <Sparkles size={18} /> Buat Ringkasan
                        </Button>
                    </div>
                </Card>

                {/* PANEL KANAN: AREA OUTPUT RINGKASAN */}
                <Card className="flex flex-col bg-white relative">
                    {outputState === 'empty' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-slide-up">
                            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#F4A261]/5 rounded-full"></div>
                                <div className="absolute bottom-4 right-4 w-12 h-12 bg-[#FDFDF9] rounded-xl border border-gray-100 shadow-sm flex items-center justify-center transform rotate-12">
                                    <FileText size={20} className="text-[#A0AEC0]" />
                                </div>
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-50 flex items-center justify-center relative z-10">
                                    <Coffee size={36} className="text-[#F4A261] opacity-80" />
                                </div>
                            </div>
                            <h3 className="text-[18px] font-semibold text-[#2D3748] mb-2">Belum ada ringkasan</h3>
                            <p className="text-[#718096] text-[14px] max-w-xs">
                                Hasil analisis AI terstruktur akan muncul di panel ini. Masukkan konten dokumen Anda terlebih dahulu di panel kiri.
                            </p>
                        </div>
                    )}

                    {outputState === 'loading' && (
                        <div className="flex-1 p-8 flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-lg animate-shimmer"></div>
                                <div className="w-48 h-6 rounded animate-shimmer"></div>
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-5 h-5 rounded-full animate-shimmer shrink-0 mt-1"></div>
                                        <div className="space-y-3 flex-1">
                                            <div className={`h-4 ${i === 2 ? 'w-[80%]' : 'w-full'} rounded animate-shimmer`}></div>
                                            <div className={`h-4 ${i === 3 ? 'w-[85%]' : 'w-[90%]'} rounded animate-shimmer`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {outputState === 'result' && (
                        <div className="flex-1 flex flex-col animate-slide-up">
                            {/* Toolbar Atas Output */}
                            <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#F4A261]/10 rounded-md text-[#F4A261]">
                                        <Sparkles size={16} />
                                    </div>
                                    <h2 className="font-bold text-[16px] text-[#2D3748]">Intisari Dokumen</h2>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                    <button 
                                        onClick={handleCopy} 
                                        className="p-1.5 text-[#718096] hover:text-[#2D3748] hover:bg-white rounded-md transition-all shadow-sm" 
                                        title="Salin ke Clipboard"
                                    >
                                        {isCopied ? <Check size={16} className="text-[#38A169]" /> : <Copy size={16} />}
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200"></div>
                                    <button 
                                        onClick={handleDownload} 
                                        className="p-1.5 text-[#718096] hover:text-[#2D3748] hover:bg-white rounded-md transition-all shadow-sm" 
                                        title="Unduh (.txt)"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <div className="w-[1px] h-4 bg-gray-200"></div>
                                    <button 
                                        onClick={handleSave} 
                                        className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-white rounded-md transition-all shadow-sm" 
                                        title="Simpan ke Riwayat Workspace"
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Konten Butir Ringkasan AI */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <ul className="space-y-5">
                                    {hasilRingkasan.map((point, idx) => (
                                        <li key={idx} className="flex gap-4 items-start group">
                                            <CheckCircle2 size={20} className="text-[#F4A261] mt-0.5 shrink-0" strokeWidth={2.5} />
                                            <span className="text-[15px] leading-[1.6] text-[#4A5568] group-hover:text-[#2D3748] transition-colors">
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
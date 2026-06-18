import React, { useState, useRef } from 'react';
import { 
  UploadCloud, ArrowRight, RotateCcw, 
  FileQuestion, Cpu, Check, Sparkles, AlertTriangle, Tags, FileText, Copy, Download
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API_ENDPOINTS } from '../config/api';

export default function Klasifikasi() {
  const [appState, setAppState] = useState<'idle' | 'processing' | 'result'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingText, setLoadingText] = useState('Membaca file...');
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dokumen, setDokumen] = useState({ nama: '', teks: '' });
  const [hasilAI, setHasilAI] = useState({
    kategori: '',
    prioritas: '',
    divisi: '',
    tindakLanjut: ''
  });

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => { setIsDragOver(false); };
  
  const handleDrop = (e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragOver(false); 
    const file = e.dataTransfer.files[0];
    if (file) prosesFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) prosesFile(file);
  };

  const prosesFile = (file: File) => {
    if (file.type !== 'text/plain') {
      alert("Untuk testing saat ini, gunakan file .txt dulu ya!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setDokumen({ nama: file.name, teks: text });
      await tembakAPIClassify(text, file.name);
    };
    reader.readAsText(file);
  };

  const tembakAPIClassify = async (teks: string, filename: string) => {
    setAppState('processing');
    setErrorMsg('');
    
    setTimeout(() => setLoadingText('Mengirim ke FastAPI...'), 500);
    setTimeout(() => setLoadingText('AI sedang menganalisis...'), 1500);

    try {
      const response = await fetch(API_ENDPOINTS.classify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teks: teks,
          filename: filename,
          use_model: "indobert"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Gagal menghubungi server');
      }

      setHasilAI({
        kategori: data.kategori || 'Tidak Diketahui',
        prioritas: data.prioritas || 'Sedang',
        divisi: data.routing?.divisi || 'Divisi Umum',
        tindakLanjut: data.routing?.tindak_lanjut || 'Menunggu arahan lebih lanjut'
      });

      setAppState('result');
      showToast('Dokumen berhasil diklasifikasi!');

    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
      setAppState('idle');
      alert(`Gagal: ${error.message} \nPastikan backend FastAPI sudah berjalan!`);
    }
  };

  const resetState = () => {
    setAppState('idle');
    setDokumen({ nama: '', teks: '' });
    setIsCopied(false);
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const handleCopy = () => {
    const textToCopy = `Hasil Klasifikasi Dokumen: ${dokumen.nama}\nKategori: ${hasilAI.kategori}\nPrioritas: ${hasilAI.prioritas}\nRekomendasi Divisi: ${hasilAI.divisi}\nTindak Lanjut: ${hasilAI.tindakLanjut}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast('Hasil disalin ke clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = `Hasil Klasifikasi Dokumen: ${dokumen.nama}\n\nKategori: ${hasilAI.kategori}\nPrioritas: ${hasilAI.prioritas}\n\nRekomendasi Aksi:\nTeruskan ke ${hasilAI.divisi}\nCatatan: ${hasilAI.tindakLanjut}`;
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Klasifikasi_${dokumen.nama}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col pt-2 md:pt-4 animate-slide-up relative h-full">
      
      {/* Notifikasi Toast (Tetap hijau untuk menandakan 'Success') */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-[100] bg-white px-4 py-3 md:px-5 md:py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
          <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]">
            <Check size={14} strokeWidth={3} />
          </div>
          <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="mb-6 md:mb-5 text-center mt-4 md:mt-0">
            <h1 className="text-2xl md:text-[28px] font-bold text-[#2D3748] tracking-tight mb-2">Klasifikasi Dokumen</h1>
        <p className="text-[#718096] text-sm md:text-base max-w-2xl mx-auto">
          Unggah dokumen teks untuk dianalisis dan dikategorikan secara otomatis oleh AI.
        </p>
      </div>

      <div className="flex-1 flex flex-col relative w-full">
        
        {/* STATE 1: IDLE (DRAG & DROP ZONE) */}
        {appState === 'idle' && (
          <div className="flex-1 flex items-start md:items-center justify-center mt-2 md:mt-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".txt" 
              className="hidden" 
            />
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-[92%] md:max-w-[70%] lg:max-w-[55%] min-h-[300px] md:min-h-[350px] border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center p-6 md:p-8 transition-all duration-300 ease-in-out cursor-pointer ${
                isDragOver ? 'border-[#F4A261] bg-[#F4A261]/[0.05] scale-[1.02] shadow-xl' : 'border-[#CBD5E0] bg-white hover:border-[#F4A261]/40 hover:bg-[#FDFBF7]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FDFBF7] flex items-center justify-center mb-4 md:mb-6 transition-transform duration-300 border border-gray-100 shadow-sm ${isDragOver ? 'scale-110 text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                <UploadCloud size={32} className="md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] md:text-[18px] font-semibold text-[#2D3748] mb-1.5 pointer-events-none">Tarik & Lepas file di sini</h3>
              <p className="text-[13px] md:text-sm text-[#718096] mb-6 md:mb-8 pointer-events-none text-center">Mendukung file TXT (Maks. 10MB)</p>
              
              <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-[#F4A261] hover:bg-[#E88D67] text-sm md:text-base">
                Browse File
              </Button>
            </div>
          </div>
        )}

        {/* STATE 2: PROCESSING (SCANNER) */}
        {appState === 'processing' && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 md:p-12 flex flex-col items-center border-0 shadow-lg">
              <div className="relative w-20 h-28 md:w-24 md:h-32 bg-[#FDFBF7] border-2 border-gray-100 rounded-xl flex items-center justify-center mb-6 md:mb-8 overflow-hidden">
                <FileQuestion size={40} className="text-[#CBD5E0] md:w-12 md:h-12" strokeWidth={1.5} />
                <div className="absolute left-0 w-full h-[3px] bg-[#F4A261] shadow-[0_0_15px_rgba(244,162,97,0.8)] animate-scanner z-10"></div>
                <div className="absolute left-0 w-full h-12 bg-gradient-to-b from-[#F4A261]/20 to-transparent animate-scanner -mt-12 z-0"></div>
              </div>
              <div className="flex items-center gap-3">
                <Cpu size={18} className="text-[#F4A261] animate-pulse md:w-5 md:h-5" />
                <span className="text-sm md:text-[16px] font-medium text-[#2D3748] min-w-[180px] md:min-w-[200px] text-center">{loadingText}</span>
              </div>
            </Card>
          </div>
        )}

        {/* STATE 3: RESULT (SPLIT-SCREEN) */}
        {appState === 'result' && (
          <div className="w-full flex flex-col lg:flex-row gap-4 md:gap-6 pb-6">
            
            {/* Panel Kiri: Pratinjau Teks Asli */}
            <Card className="w-full lg:w-[50%] flex flex-col h-[400px] md:h-[550px] border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                <div className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-md text-[#718096]"><FileText size={16} /></div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-[#2D3748] text-[13px] md:text-sm">Pratinjau Dokumen</h3>
                  <p className="text-[11px] md:text-xs text-[#A0AEC0] truncate">{dokumen.nama}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 text-[13px] md:text-[14px] leading-relaxed text-[#4A5568] whitespace-pre-wrap bg-[#FDFBF7]/30">
                {dokumen.teks}
              </div>
            </Card>

            {/* Panel Kanan: Hasil AI dengan Toolbar Bawaan */}
            <Card className="w-full lg:w-[50%] flex flex-col flex-1 border-gray-100 shadow-sm overflow-hidden">
              
              {/* TOOLBAR ATAS (Copy, Download, Reset) */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#F4A261]/10 rounded-md text-[#F4A261]">
                    <Sparkles size={16} />
                  </div>
                  <h2 className="font-bold text-[14px] md:text-[16px] text-[#2D3748]">Hasil Analisis AI</h2>
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
                  <button 
                    onClick={resetState} 
                    className="p-1.5 text-[#718096] hover:text-[#E53E3E] hover:bg-red-50 rounded-md transition-all flex items-center gap-1.5 px-2" 
                    title="Ulangi Analisis"
                  >
                    <RotateCcw size={14} />
                    <span className="text-[12px] font-semibold hidden md:block">Ulangi</span>
                  </button>
                </div>
              </div>

              {/* Konten Hasil AI */}
              <div className="p-6 md:p-8 space-y-6 md:space-y-8 flex-1 bg-white">
                <div>
                  <p className="text-[11px] md:text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 md:mb-3">Kategori Prediksi</p>
                  <div className="inline-flex items-center px-3.5 py-1.5 md:px-4 md:py-2 bg-[#EBF8FF] border border-[#BEE3F8] rounded-xl text-[#3182CE] font-bold text-[14px] md:text-[15px] shadow-sm">
                    <Tags size={16} className="mr-2" /> {hasilAI.kategori}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] md:text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 md:mb-3">Status Prioritas</p>
                  <div className={`inline-flex items-center px-3.5 py-1.5 md:px-4 md:py-2 border rounded-xl font-bold text-[14px] md:text-[15px] shadow-sm ${
                    hasilAI.prioritas === 'Tinggi' 
                      ? 'bg-[#FFF5F5] border-[#FED7D7] text-[#E53E3E] animate-pulse'
                      : hasilAI.prioritas === 'Sedang'
                      ? 'bg-[#FFFFF0] border-[#FEFCBF] text-[#D69E2E]'
                      : 'bg-[#F0FFF4] border-[#C6F6D5] text-[#38A169]'
                  }`}>
                    <AlertTriangle size={16} className="mr-2" /> {hasilAI.prioritas}
                  </div>
                </div>

                <div className="p-4 md:p-5 bg-[#FDFBF7] rounded-xl border border-gray-100 flex items-start gap-3 mt-2">
                  <div className="mt-0.5 text-[#F4A261] p-1 bg-[#F4A261]/10 rounded-lg"><ArrowRight size={16} /></div>
                  <div>
                    <p className="text-[12px] md:text-[13px] font-semibold text-[#718096] mb-1">Rekomendasi Aksi:</p>
                    <p className="font-bold text-[#2D3748] text-[13px] md:text-sm">Teruskan ke {hasilAI.divisi}</p>
                    <p className="text-[12px] md:text-xs text-[#718096] mt-1.5 leading-relaxed">{hasilAI.tindakLanjut}</p>
                  </div>
                </div>
              </div>

            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
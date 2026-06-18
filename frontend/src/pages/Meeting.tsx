import { useState, useRef } from 'react';
import {
  FileText, UploadCloud, Sparkles, ClipboardCheck, Check,
  Target, Gavel, Users, FileUp, Tag, StickyNote,
  Copy, Download, RotateCcw
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API_ENDPOINTS } from '../config/api';

// Definisi tipe data untuk UI
interface Task {
  id: number;
  text: string;
  assignee: string;
  done: boolean;
}

interface Peserta {
  nama: string;
  peran: string;
  inisial: string;
}

export default function Meeting() {
  // Tab State
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [isDragOver, setIsDragOver] = useState(false);

  // App State
  const [appState, setAppState] = useState<'empty' | 'loading' | 'result'>('empty');
  const [inputText, setInputText] = useState("");
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [isCopied, setIsCopied] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data State Sesuai Struktur Backend
  const [ringkasan, setRingkasan] = useState<string>('');
  const [topikUtama, setTopikUtama] = useState<string[]>([]);
  const [keputusan, setKeputusan] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [catatanTambahan, setCatatanTambahan] = useState<string>('');

  const API_URL = API_ENDPOINTS.meeting;

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // --- LOGIKA FILE UPLOAD ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
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
      showToast("Error: Ukuran file terlalu besar (Maks 10MB).");
      return;
    }

    setUploadedFile(file);

    if (file.type.includes("text") || file.name.endsWith('.txt') || file.name.endsWith('.vtt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
        showToast(`Berhasil memuat transkrip: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      showToast("Format file belum didukung. Coba .txt atau .vtt");
    }
  };

  // --- API CALL & DATA MAPPING ---
  const handleProcessMeeting = async () => {
    if (activeTab === 'text' && !inputText.trim()) {
      showToast("Teks transkrip tidak boleh kosong.");
      return;
    }
    if (activeTab === 'file' && !inputText.trim()) {
      showToast("Teks transkrip file kosong. Pastikan file terunggah dan terbaca dengan benar.");
      return;
    }

    setAppState('loading');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teks: inputText.trim(),
          filename: activeTab === 'file' && uploadedFile ? uploadedFile.name : "Teks Manual"
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || result.error || "Gagal memproses transkrip rapat.");
      }

      const meetingData = result.data;

      setRingkasan(meetingData.ringkasan || "Tidak ada ringkasan.");
      setTopikUtama(meetingData.topik_utama || []);
      setKeputusan(meetingData.keputusan || []);

      const mappedTasks: Task[] = (meetingData.action_items || []).map((item: any, index: number) => {
        const hasDeadline = item.deadline && item.deadline !== 'Tidak disebutkan' && item.deadline !== '-';
        const taskText = hasDeadline ? `${item.tugas} (Tenggat: ${item.deadline})` : item.tugas;

        return {
          id: index + 1,
          text: taskText,
          assignee: item.pic && item.pic !== 'Tidak disebutkan' && item.pic !== '-' ? item.pic : 'Tim',
          done: false
        };
      });
      setTasks(mappedTasks);

      const mappedPeserta: Peserta[] = (meetingData.peserta || []).map((namaStr: string) => {
        const namaBersih = namaStr.trim();
        return {
          nama: namaBersih,
          peran: "Peserta",
          inisial: namaBersih.length > 0 ? namaBersih.charAt(0).toUpperCase() : "P"
        };
      });
      setPeserta(mappedPeserta);

      setCatatanTambahan(
        meetingData.catatan_tambahan && meetingData.catatan_tambahan !== "Tidak disebutkan" && meetingData.catatan_tambahan !== "-"
          ? meetingData.catatan_tambahan
          : ""
      );

      setAppState('result');
      showToast('Notulensi rapat berhasil dibuat!');

    } catch (error: any) {
      console.error("Error Processing Meeting:", error);
      showToast("Error: " + error.message);
      setAppState('empty');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  const resetState = () => {
    setAppState('empty');
    setInputText('');
    setUploadedFile(null);
    setIsCopied(false);
    setRingkasan('');
    setTopikUtama([]);
    setKeputusan([]);
    setTasks([]);
    setPeserta([]);
    setCatatanTambahan('');
  };

  // --- FUNGSI TOOLBAR (COPY, DOWNLOAD) ---
  const formatMeetingForExport = () => {
    let text = "=========================================\n";
    text += "   HASIL NOTULENSI RAPAT - SNAPFLOW\n";
    text += "=========================================\n\n";

    text += "📋 RINGKASAN INTI\n-----------------\n" + ringkasan + "\n\n";

    if (topikUtama.length > 0) {
      text += "🗂️ TOPIK UTAMA\n-----------------\n";
      topikUtama.forEach((t, i) => text += `${i + 1}. ${t}\n`);
      text += "\n";
    }

    if (keputusan.length > 0) {
      text += "✅ KEPUTUSAN UTAMA\n-----------------\n";
      keputusan.forEach((k, i) => text += `${i + 1}. ${k}\n`);
      text += "\n";
    }

    if (tasks.length > 0) {
      text += "📌 ACTION ITEMS\n-----------------\n";
      tasks.forEach((t, i) => text += `${i + 1}. ${t.text} (PIC: @${t.assignee})\n`);
      text += "\n";
    }

    if (peserta.length > 0) {
      text += "👥 PESERTA TERDETEKSI\n-----------------\n";
      peserta.forEach(p => text += `- ${p.nama}\n`);
      text += "\n";
    }

    if (catatanTambahan) {
      text += "📝 CATATAN TAMBAHAN\n-----------------\n" + catatanTambahan + "\n";
    }

    return text;
  };

  const handleCopy = async () => {
    try {
      const textToCopy = formatMeetingForExport();
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      showToast('Notulensi berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      showToast('Gagal menyalin teks.');
    }
  };

  const handleDownload = () => {
    const textToDownload = formatMeetingForExport();
    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = uploadedFile ? `Notulensi_${uploadedFile.name.replace(/\.[^/.]+$/, "")}.txt` : "SnapFlow_Notulensi.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('File notulensi (.txt) berhasil diunduh!');
  };

  const avatarColors = [
    { bg: 'bg-[#EBF8FF]', border: 'border-[#BEE3F8]', text: 'text-[#2B6CB0]' },
    { bg: 'bg-[#F0FFF4]', border: 'border-[#C6F6D5]', text: 'text-[#2F855A]' },
    { bg: 'bg-[#FFF5F5]', border: 'border-[#FED7D7]', text: 'text-[#C53030]' },
    { bg: 'bg-[#FAF5FF]', border: 'border-[#E9D8FD]', text: 'text-[#553C9A]' },
    { bg: 'bg-[#FFFFF0]', border: 'border-[#FEFCBF]', text: 'text-[#975A16]' },
  ];

  return (
    <div className="flex-1 flex flex-col pt-2 md:pt-4 h-full animate-slide-up relative">

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-[100] bg-white px-4 py-3 md:px-5 md:py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
          <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]"><Check size={14} strokeWidth={3} /></div>
          <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
        </div>
      )}

      {/* Header Halaman (Responsif) */}
      <div className="mb-6 md:mb-8 text-center md:text-left px-2 md:px-0">
        <h1 className="text-[22px] md:text-[28px] font-bold text-[#2D3748] tracking-tight mb-1.5 md:mb-2">Asisten Rapat AI</h1>
        <p className="text-[#718096] text-[13px] md:text-[15px] max-w-2xl mx-auto md:mx-0">
          Ubah hasil transkrip mentah menjadi ringkasan, keputusan, dan daftar tugas terstruktur secara instan.
        </p>
      </div>

      {/* Split-Screen Layout (Stacked di Mobile) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 pb-6 h-full">

        {/* PANEL KIRI: INPUT TRANSKRIP */}
        <Card className="w-full lg:w-[40%] flex flex-col bg-white min-h-[400px] lg:min-h-[600px] shadow-sm overflow-hidden">
          
          {/* Header Tabs (Scrollable di HP) */}
          <div className="flex px-4 md:px-6 pt-4 border-b border-gray-100 gap-4 md:gap-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setActiveTab('text'); setUploadedFile(null); }}
              className={`pb-3 flex items-center gap-2 text-[13px] md:text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'text' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
            >
              <FileText size={16} className="md:w-[18px] md:h-[18px]" /> Teks Transkrip
              {activeTab === 'text' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F4A261] rounded-t-full"></div>}
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`pb-3 flex items-center gap-2 text-[13px] md:text-[15px] font-semibold transition-all relative whitespace-nowrap ${activeTab === 'file' ? 'text-[#F4A261]' : 'text-[#A0AEC0] hover:text-[#718096]'}`}
            >
              <FileUp size={16} className="md:w-[18px] md:h-[18px]" /> Unggah File
              {activeTab === 'file' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#F4A261] rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab Konten Text */}
          {activeTab === 'text' && (
            <div className="flex-1 p-4 md:p-5 bg-[#FDFBF7]/50 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tempelkan hasil rekaman percakapan rapat atau catatan mentah di sini..."
                className="w-full h-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-[#4A5568] text-[14px] leading-[1.7] custom-scrollbar placeholder-[#CBD5E0] min-h-[250px] md:min-h-0"
              ></textarea>
            </div>
          )}

          {/* Tab Konten File */}
          {activeTab === 'file' && (
            <div className="flex-1 flex flex-col p-4 md:p-6">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".txt,.vtt" className="hidden" />
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={triggerFileSelect}
                className={`flex-1 border-2 border-dashed rounded-[16px] md:rounded-[20px] flex flex-col items-center justify-center p-6 transition-all duration-300 cursor-pointer min-h-[250px] md:min-h-0 ${isDragOver ? 'border-[#F4A261] bg-[#F4A261]/[0.05]' : 'border-[#CBD5E0] bg-[#FDFBF7] hover:border-[#F4A261]/50'}`}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 transition-colors ${isDragOver || uploadedFile ? 'text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                  <UploadCloud size={28} className="md:w-[32px] md:h-[32px]" strokeWidth={1.5} />
                </div>
                {uploadedFile ? (
                  <div className="text-center">
                    <h3 className="text-[15px] md:text-[16px] font-semibold text-[#38A169] mb-1">Berhasil Dimuat!</h3>
                    <p className="text-[13px] md:text-sm font-medium text-[#2D3748] truncate max-w-[200px] md:max-w-xs mx-auto mb-1">{uploadedFile.name}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-[15px] md:text-[16px] font-medium text-[#2D3748] mb-1">Tarik file di sini</h3>
                    <p className="text-[12px] md:text-xs text-[#718096]">Mendukung format .TXT atau .VTT</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 md:p-5 border-t border-gray-50 bg-white mt-auto">
            <Button 
              onClick={handleProcessMeeting} 
              disabled={(activeTab === 'text' && !inputText.trim()) || (activeTab === 'file' && !uploadedFile) || appState === 'loading'} 
              className="w-full py-2.5 md:py-3 bg-[#F4A261] hover:bg-[#E88D67] text-white text-sm md:text-base border-none"
            >
              <Sparkles size={18} /> Analisis Rapat
            </Button>
          </div>
        </Card>

        {/* PANEL KANAN: BENTO GRID DASHBOARD */}
        <div className="w-full lg:w-[60%] flex flex-col h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 relative z-0">

          {appState === 'empty' && (
            <div className="flex-1 bg-white border border-gray-200 border-dashed rounded-[20px] md:rounded-[24px] flex flex-col items-center justify-center text-center p-6 md:p-8 min-h-[300px]">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#FDFBF7] flex items-center justify-center mb-4 md:mb-6 border border-gray-100 shadow-sm"><ClipboardCheck size={28} className="text-[#CBD5E0] md:w-[32px] md:h-[32px]" /></div>
              <h3 className="text-[15px] md:text-[16px] font-semibold text-[#2D3748] mb-2">Belum Ada Hasil Analisis</h3>
              <p className="text-[#718096] text-[13px] md:text-sm max-w-sm">Berikan teks transkrip rapat di panel kiri kemudian klik tombol untuk memproses data.</p>
            </div>
          )}

          {(appState === 'loading' || appState === 'result') && (
            <div className="flex flex-col">

              {/* TOOLBAR ATAS OUTPUT */}
              {appState === 'result' && (
                <div className="flex justify-between items-center px-2 pb-4 mb-4 border-b border-gray-200/60 animate-slide-up">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#F4A261]/10 rounded-md text-[#F4A261]">
                      <Sparkles size={16} />
                    </div>
                    <h2 className="font-bold text-[14px] md:text-[16px] text-[#2D3748]">Hasil Notulensi</h2>
                  </div>
                  <div className="flex items-center gap-1 bg-white shadow-sm p-1 rounded-lg border border-gray-100">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-[#718096] hover:text-[#F4A261] hover:bg-orange-50 rounded-md transition-all"
                      title="Salin Hasil"
                    >
                      {isCopied ? <Check size={16} className="text-[#F4A261]" /> : <Copy size={16} />}
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
              )}

              {/* BENTO GRID (Ditumpuk di HP -> Grid-cols-1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 pb-4">

                {/* BENTO 1: Ringkasan & Topik Utama */}
                <Card className={`md:col-span-2 p-5 md:p-6 ${appState === 'result' ? 'reveal-1' : ''}`}>
                  {appState === 'loading' ? (
                    <div className="space-y-3">
                      <div className="h-4 w-full rounded animate-shimmer"></div>
                      <div className="h-4 w-[90%] rounded animate-shimmer"></div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-bold text-[#2D3748] text-[14px] md:text-[15px] mb-3">Ringkasan Inti Rapat</h3>
                      <p className="text-[13px] md:text-[14px] leading-relaxed text-[#4A5568] mb-5">{ringkasan}</p>

                      {topikUtama.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[#718096] uppercase tracking-wider mb-2.5">
                            <Tag size={13} /> Topik Utama:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {topikUtama.map((topik, index) => (
                              <span key={index} className="px-3 py-1 bg-[#FDFBF7] border border-gray-100 text-gray-600 rounded-full text-[11px] md:text-xs font-medium shadow-sm">
                                {topik}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* BENTO 2: Keputusan Utama */}
                <Card className={`col-span-1 !bg-[#FDFBF7] border border-[#F4A261]/20 p-5 md:p-6 flex flex-col shadow-sm ${appState === 'result' ? 'reveal-2' : ''}`}>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <div className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-[#2D3748]"><Gavel size={16} className="md:w-[18px] md:h-[18px]"/></div>
                    <h3 className="font-bold text-[#2D3748] text-[14px] md:text-[15px]">Keputusan Utama</h3>
                  </div>
                  {appState === 'loading' ? (
                    <div className="space-y-3 md:space-y-4">
                      <div className="h-8 md:h-10 w-full rounded-full animate-shimmer"></div>
                      <div className="h-8 md:h-10 w-[80%] rounded-full animate-shimmer"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 md:gap-3">
                      {keputusan.length > 0 ? keputusan.map((kpts, idx) => (
                        <div key={idx} className="px-3.5 py-2 md:px-4 md:py-2.5 bg-white border border-[#F4A261]/30 rounded-xl text-[#D9774F] font-semibold text-[12px] md:text-[13px] shadow-sm">
                          {idx + 1}. {kpts}
                        </div>
                      )) : (
                        <div className="text-[12px] md:text-sm text-gray-400 italic">Tidak ada poin keputusan.</div>
                      )}
                    </div>
                  )}
                </Card>

                {/* BENTO 3: Action Items */}
                <Card className={`col-span-1 p-5 md:p-6 flex flex-col shadow-sm ${appState === 'result' ? 'reveal-3' : ''}`}>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <div className="p-1.5 bg-[#10B981]/10 rounded-lg text-[#10B981]"><Target size={16} className="md:w-[18px] md:h-[18px]" /></div>
                    <h3 className="font-bold text-[#2D3748] text-[14px] md:text-[15px]">Action Items (Tugas)</h3>
                  </div>
                  {appState === 'loading' ? (
                    <div className="space-y-4">
                      <div className="flex gap-3"><div className="w-4 h-4 md:w-5 md:h-5 rounded animate-shimmer"></div><div className="h-3 md:h-4 w-full rounded animate-shimmer"></div></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 md:gap-3">
                      {tasks.length > 0 ? tasks.map(task => (
                        <div key={task.id} onClick={() => toggleTask(task.id)} className={`flex items-start gap-2.5 md:gap-3 p-2 md:p-2.5 -mx-2 rounded-xl cursor-pointer transition-all group ${task.done ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                          <div className={`mt-0.5 min-w-[18px] w-[18px] h-[18px] md:min-w-[20px] md:w-[20px] md:h-[20px] rounded-[6px] flex items-center justify-center transition-colors border ${task.done ? 'bg-[#F4A261] border-[#F4A261] text-white' : 'bg-white border-[#CBD5E0] group-hover:border-[#F4A261]'}`}>
                            <Check size={12} strokeWidth={3} className={`transition-transform duration-200 ${task.done ? 'scale-100' : 'scale-0'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[12px] md:text-[13px] leading-snug transition-all duration-300 ${task.done ? 'text-[#A0AEC0] line-through decoration-[#F4A261]/60' : 'text-[#4A5568] font-medium'}`}>{task.text}</span>
                            <span className="text-[10px] md:text-[11px] text-[#718096] mt-1 font-semibold">@{task.assignee}</span>
                          </div>
                        </div>
                      )) : (
                        <div className="text-[12px] md:text-sm text-gray-400 italic">Tidak ada tugas yang terdeteksi.</div>
                      )}
                    </div>
                  )}
                </Card>

                {/* BENTO 4: Peserta Terdeteksi */}
                <Card className={`col-span-1 p-5 md:p-6 shadow-sm ${appState === 'result' ? 'reveal-4' : ''}`}>
                  <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <div className="p-1.5 bg-[#4299E1]/10 rounded-lg text-[#4299E1]"><Users size={16} className="md:w-[18px] md:h-[18px]"/></div>
                    <h3 className="font-bold text-[#2D3748] text-[14px] md:text-[15px]">Peserta</h3>
                  </div>
                  {appState === 'loading' ? (
                    <div className="flex gap-4"><div className="w-9 h-9 md:w-11 md:h-11 rounded-full animate-shimmer"></div><div className="w-9 h-9 md:w-11 md:h-11 rounded-full animate-shimmer"></div></div>
                  ) : (
                    <div className="flex flex-col gap-3 md:gap-3.5 max-h-[180px] md:max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {peserta.length > 0 ? peserta.map((p, idx) => {
                        const colorTheme = avatarColors[idx % avatarColors.length];
                        return (
                          <div key={idx} className="flex items-center gap-2.5 md:gap-3">
                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full ${colorTheme.bg} border ${colorTheme.border} flex items-center justify-center ${colorTheme.text} font-bold text-[12px] md:text-[13px]`}>
                              {p.inisial}
                            </div>
                            <span className="text-[12px] md:text-[13px] font-bold text-[#2D3748]">{p.nama}</span>
                          </div>
                        )
                      }) : (
                        <div className="text-[12px] md:text-sm text-gray-400 italic">Tidak ada peserta terdeteksi.</div>
                      )}
                    </div>
                  )}
                </Card>

                {/* BENTO 5: Catatan Tambahan */}
                <Card className={`col-span-1 p-5 md:p-6 flex flex-col shadow-sm ${appState === 'result' ? 'reveal-5' : ''}`}>
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="p-1.5 bg-[#9F7AEA]/10 rounded-lg text-[#9F7AEA]"><StickyNote size={16} className="md:w-[18px] md:h-[18px]"/></div>
                    <h3 className="font-bold text-[#2D3748] text-[14px] md:text-[15px]">Catatan Tambahan</h3>
                  </div>
                  {appState === 'loading' ? (
                    <div className="space-y-2"><div className="h-3 md:h-4 w-full rounded animate-shimmer"></div><div className="h-3 md:h-4 w-[60%] rounded animate-shimmer"></div></div>
                  ) : (
                    <div className="flex-1 text-[12px] md:text-[13px] leading-relaxed text-[#718096] overflow-y-auto custom-scrollbar">
                      {catatanTambahan ? (
                        <p className="bg-gray-50/50 p-2.5 md:p-3 rounded-xl border border-gray-100 whitespace-pre-line">{catatanTambahan}</p>
                      ) : (
                        <p className="italic text-gray-400">Tidak ada catatan tambahan khusus luar agenda utama.</p>
                      )}
                    </div>
                  )}
                </Card>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
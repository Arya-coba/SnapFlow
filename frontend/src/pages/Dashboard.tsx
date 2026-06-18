import { useState, useEffect } from 'react';
import { 
  Folder, AlertTriangle, Sparkles, FileText, 
  ChevronRight, Download, Loader2, Plus, Mic, Bot, Clock, ArrowRight
} from 'lucide-react';
import Card from '../components/ui/Card';
import { API_ENDPOINTS } from '../config/api';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);

  // FETCH DATA DARI BACKEND
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.stats);
        const jsonStats = await response.json();
        
        // Perbaikan: Langsung simpan jsonStats, karena datanya ada di root (sejajar dengan success)
        if (jsonStats.success) setStatsData(jsonStats);

        // Ambil 4 dokumen terbaru agar tampilan ringkas
        const resHistory = await fetch(`${API_ENDPOINTS.historyDocuments}?limit=4`);
        const jsonHistory = await resHistory.json();
        
        // Untuk history, datanya dibungkus di dalam .data
        if (jsonHistory.success) setRecentDocuments(jsonHistory.data);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setMounted(true), 100);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 h-[80vh] animate-slide-up">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <h3 className="text-base md:text-lg font-bold text-slate-700">Menyiapkan Ruang Kerjamu...</h3>
      </div>
    );
  }

  // --- PERBAIKAN PEMETAAN DATA ---
  // Disesuaikan persis dengan output JSON backend Anda
  const totalDokumen = statsData?.total_documents || 0;
  const prioritasTinggi = statsData?.dist_prioritas?.Tinggi || 0;

  const getCategoryBars = () => {
    // Sesuaikan dengan key dist_kategori
    const kategoriData = statsData?.dist_kategori || {};
    const total = Object.values(kategoriData).reduce((a: any, b: any) => a + b, 0) as number || 1; 
    
    const colorMap: any = {
      'Tiket IT': '#10B981', 
      'Email HR': '#34D399', 
      'Laporan Keuangan': '#FBBF24', 
      'Pengadaan': '#94A3B8', 
      'SOP HR': '#64748B'
    };

    return Object.entries(kategoriData)
      .map(([nama, jumlah]: [string, any]) => ({
        color: colorMap[nama] || '#CBD5E0',
        pct: (jumlah / total) * 100,
        namaAsli: nama,
        jumlahAsli: jumlah
      }))
      .sort((a, b) => b.jumlahAsli - a.jumlahAsli) // Urutkan dari yang terbanyak
      .slice(0, 4); // Ambil Top 4 saja
  };

  const topCategories = getCategoryBars();

  return (
    <div className="flex-1 flex flex-col pt-4 animate-slide-up relative min-h-full px-4 md:px-2 max-w-7xl mx-auto w-full pb-10">
      
      {/* WELCOME BANNER */}
      <Card className="relative w-full bg-white rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-center justify-between p-6 md:p-8 mb-6 md:mb-8 border border-slate-100 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 w-full text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-xl md:text-3xl font-bold text-slate-800 mb-2 tracking-tight">
            Selamat datang, Rizqiyah! 👋
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto md:mx-0">
            Pilih alat AI yang ingin kamu gunakan hari ini untuk mempercepat pekerjaanmu.
          </p>
        </div>

        <div className="hidden md:flex relative z-10 items-center justify-center w-24 h-24 shrink-0 mr-4">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-[spin_10s_linear_infinite] border-t-2 border-amber-500/30"></div>
          <div className="relative w-12 h-14 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center justify-center transform rotate-3">
            <div className="w-6 h-1 bg-amber-400/60 rounded-full mb-1"></div>
            <div className="w-8 h-1 bg-amber-400/60 rounded-full mb-1"></div>
            <div className="w-5 h-1 bg-amber-500 rounded-full"></div>
            <Sparkles size={12} className="absolute bottom-1 right-1 text-amber-500" />
          </div>
        </div>
      </Card>

      {/* QUICK ACTIONS */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">AI Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
          
          <button className="flex flex-col items-start bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={20} className="text-emerald-500" />
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-4">
              <Plus size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg mb-1">Klasifikasi</h3>
            <p className="text-xs md:text-sm text-slate-500 line-clamp-2">Unggah dokumen untuk deteksi kategori & ringkasan.</p>
          </button>

          <button className="flex flex-col items-start bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={20} className="text-amber-500" />
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors mb-4">
              <Mic size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg mb-1">Notulensi Rapat</h3>
            <p className="text-xs md:text-sm text-slate-500 line-clamp-2">Ubah transkrip jadi action items dan keputusan.</p>
          </button>

          <button className="flex flex-col items-start bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all group text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={20} className="text-blue-500" />
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors mb-4">
              <Bot size={24} className="md:w-7 md:h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg mb-1">Tanya AI (RAG)</h3>
            <p className="text-xs md:text-sm text-slate-500 line-clamp-2">Chat dengan dokumen pedoman dan panduan internal.</p>
          </button>

        </div>
      </div>

      {/* BOTTOM SECTION: AKTIVITAS & MINI STATS */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* RECENT FILES */}
        <Card className="w-full lg:w-2/3 bg-white p-5 md:p-6 border border-slate-100 shadow-sm rounded-2xl md:rounded-3xl flex flex-col">
          <div className="flex justify-between items-center mb-5 md:mb-6">
            <div className="flex items-center gap-2.5">
              <Clock size={20} className="text-slate-400" />
              <h3 className="text-base md:text-lg font-bold text-slate-800">Aktivitas Terakhir</h3>
            </div>
            <button className="text-xs md:text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
              Lihat Semua <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex-1 flex flex-col space-y-3">
            {recentDocuments.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Belum ada dokumen yang diproses.
              </div>
            ) : (
              recentDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 md:p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-slate-800 text-sm md:text-[15px] truncate group-hover:text-emerald-700 transition-colors">
                        {doc.filename || 'Dokumen_Tanpa_Nama.txt'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] md:text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate">
                          {doc.kategori || 'Draft'}
                        </span>
                        <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md ${
                          doc.prioritas === 'Tinggi' ? 'bg-red-50 text-red-600' : 
                          doc.prioritas === 'Sedang' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {doc.prioritas || 'Sedang'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* SIDE OVERVIEW (Mini Stats) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 md:gap-5">
          
          {/* Highlight Card */}
          <Card className="bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-lg flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div>
              <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">Total Dokumen Diproses</p>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{totalDokumen}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Folder size={24} className="text-emerald-400" />
            </div>
          </Card>

          {/* Urgent Card */}
          <Card className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
              <div>
                <p className="text-red-600/80 text-[11px] md:text-xs font-bold uppercase tracking-wider mb-0.5">Prioritas Tinggi</p>
                <h3 className="text-lg font-bold text-red-700">{prioritasTinggi} <span className="text-sm font-medium text-red-600/70">Dokumen</span></h3>
              </div>
            </div>
          </Card>

          {/* Simple Kategori List */}
          <Card className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex-1">
             <h3 className="text-sm font-bold text-slate-800 mb-4">Top Kategori</h3>
             <div className="space-y-4">
                {topCategories.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada data distribusi.</p>
                ) : (
                  topCategories.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-600 truncate mr-2">{item.namaAsli}</span>
                        <span className="font-bold text-slate-800 shrink-0">{item.jumlahAsli}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: mounted ? `${item.pct}%` : '0%', backgroundColor: item.color }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
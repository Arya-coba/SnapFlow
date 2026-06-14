import { useState, useEffect } from 'react';
import { 
  Search, History, Check, Archive, X, Copy, Download, 
  Trash2, Filter, FileCode2, MoreVertical, Zap, Loader2
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

type DocumentData = {
  id: number;
  name: string;
  date: string;
  category: string;
  priority: string;
  type: string;
  summary: string[];
};

export default function Riwayat() {
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterPriority, setFilterPriority] = useState('Semua');
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/history/documents?limit=100');
      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || "Gagal mengambil riwayat");

      if (result.success && result.data) {
        const formattedData = result.data.map((item: any) => ({
          id: item.id,
          name: item.filename || 'Dokumen_Tanpa_Nama.txt',
          date: item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : 'Waktu tidak diketahui',
          category: item.kategori || 'Belum diklasifikasi',
          priority: item.prioritas || 'Sedang',
          type: (item.filename || '').split('.').pop() || 'txt',
          summary: Array.isArray(item.summary) ? item.summary : 
                   (typeof item.summary === 'string' ? JSON.parse(item.summary || '[]') : [])
        }));
        setDocuments(formattedData);
      }
    } catch (error: any) {
      console.error(error);
      showToast("Gagal memuat riwayat: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    
    try {
      // await fetch(`http://127.0.0.1:8000/history/documents/${selectedDoc.id}`, { method: 'DELETE' });
      setDocuments(documents.filter(d => d.id !== selectedDoc.id));
      closeDrawer();
      showToast('Dokumen berhasil dihapus permanen dari sistem.');
      
    } catch (error: any) {
      console.error(error);
      showToast("Gagal menghapus: " + error.message);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'Semua' || doc.category === filterCategory;
    const matchPriority = filterPriority === 'Semua' || doc.priority === filterPriority;
    return matchSearch && matchCategory && matchPriority;
  });

  const openDrawer = (doc: DocumentData) => { setSelectedDoc(doc); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setTimeout(() => setSelectedDoc(null), 300); };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const getCategoryStyle = (cat: string) => {
    const baseStyle = "px-2.5 py-1 text-[10px] md:text-[12px] font-bold rounded-md whitespace-nowrap";
    switch(cat) {
      case 'Tiket IT': return `${baseStyle} bg-indigo-50 text-indigo-600`;
      case 'Email HR': 
      case 'SOP HR': return `${baseStyle} bg-gray-100 text-gray-600`;
      case 'Laporan Keuangan': return `${baseStyle} bg-indigo-50 text-indigo-600`;
      case 'Asisten Rapat': return `${baseStyle} bg-teal-50 text-teal-600`;
      case 'Pengadaan': return `${baseStyle} bg-slate-100 text-slate-600`;
      default: return `${baseStyle} bg-gray-100 text-gray-600`;
    }
  };

  const getPriorityStyle = (prio: string) => {
    const baseStyle = "px-2.5 py-1 text-[10px] md:text-[12px] font-bold rounded-md whitespace-nowrap";
    switch(prio) {
      case 'Tinggi': return `${baseStyle} bg-red-50 text-red-600`;
      case 'Sedang': return `${baseStyle} bg-amber-50 text-amber-600`;
      case 'Rendah': return `${baseStyle} bg-emerald-50 text-emerald-600`;
      default: return `${baseStyle} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="font-sans"> 
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] bg-white px-4 md:px-5 py-3 md:py-4 rounded-xl shadow-lg border-l-4 border-emerald-500 flex items-center gap-3 animate-toast max-w-[90vw] md:max-w-md">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <Check size={14} className="md:w-4 md:h-4" strokeWidth={3} />
          </div>
          <span className="text-xs md:text-sm font-medium text-slate-800">{toast.message}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col pt-4 relative h-full z-10 max-w-7xl mx-auto w-full">
        
        {/* Header & Filters */}
        <div className="mb-6 md:mb-8 relative z-20 px-4 md:px-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Riwayat Dokumen</h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl leading-relaxed">
            Pantau dan tinjau kembali hasil klasifikasi serta ringkasan dokumen yang tersimpan dalam sistem.
          </p>
          
          <div className="mt-6 md:mt-8 bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-3 md:gap-4">
            {/* Input Pencarian */}
            <div className="relative w-full lg:flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={18} className="md:w-5 md:h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Cari nama dokumen..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-transparent text-slate-800 text-sm rounded-xl pl-10 md:pl-12 pr-4 py-2.5 md:py-3 focus:bg-white focus:border-amber-500/30 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder-slate-400"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 lg:flex gap-2.5 md:gap-3 w-full lg:w-auto">
              <div className="relative flex items-center bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-sm w-full">
                <Filter size={14} className="absolute left-3 md:left-4 text-slate-400 md:w-4 md:h-4" />
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)} 
                  className="appearance-none bg-transparent py-2.5 md:py-3 pl-8 md:pl-11 pr-8 md:pr-10 text-[11px] md:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer w-full truncate"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Tiket IT">Tiket IT</option>
                  <option value="Email HR">Email HR</option>
                  <option value="SOP HR">SOP HR</option>
                  <option value="Laporan Keuangan">Laporan Keuangan</option>
                </select>
                <div className="absolute right-3 md:right-4 pointer-events-none text-slate-400"><Zap size={12} className="md:w-[14px] md:h-[14px]"/></div>
              </div>
              
              <div className="relative flex items-center bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-sm w-full">
                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)} 
                  className="appearance-none bg-transparent py-2.5 md:py-3 px-3 md:px-4 pr-8 md:pr-10 text-[11px] md:text-sm font-medium text-slate-700 focus:outline-none cursor-pointer w-full truncate"
                >
                  <option value="Semua">Semua Prioritas</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rendah">Rendah</option>
                </select>
                <div className="absolute right-3 md:right-4 pointer-events-none text-slate-400">
                  <svg width="12" height="12" className="md:w-[14px] md:h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <Card className="flex-1 flex flex-col relative z-10 bg-white border-slate-200 shadow-sm overflow-hidden rounded-2xl mx-4 md:mx-2">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <Loader2 size={40} className="text-amber-500 animate-spin mb-4 md:mb-6 md:w-12 md:h-12" />
              <h3 className="text-base md:text-lg font-semibold text-slate-800">Memuat Data Dokumen...</h3>
              <p className="text-slate-500 text-xs md:text-sm mt-2">Menghubungkan ke database</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-slate-100 shadow-sm">
                <Archive size={32} className="text-slate-400 md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-2">Belum ada dokumen</h3>
              <p className="text-slate-500 text-sm md:text-base max-w-sm leading-relaxed">
                {documents.length === 0 
                  ? "Mulai dengan mengunggah dokumen di halaman Klasifikasi untuk melihat riwayat di sini." 
                  : "Tidak ada dokumen yang cocok dengan filter yang Anda pilih."}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto custom-scrollbar h-full">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 md:py-4 px-4 md:px-6 text-[10px] md:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">Nama Dokumen</th>
                    {/* Disembunyikan di Mobile */}
                    <th className="hidden md:table-cell py-4 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">Waktu Proses</th>
                    <th className="py-3 md:py-4 px-4 md:px-6 text-[10px] md:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">Kategori</th>
                    {/* Disembunyikan di Mobile */}
                    <th className="hidden lg:table-cell py-4 px-6 text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">Prioritas</th>
                    <th className="py-3 md:py-4 px-4 md:px-6 text-[10px] md:text-xs font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr 
                      key={doc.id} 
                      onClick={() => openDrawer(doc)} 
                      className="hover:bg-slate-50 transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="py-3 md:py-4 px-4 md:px-6 w-full md:w-auto">
                        <div className="flex items-center gap-3">
                          <FileCode2 size={18} className="text-indigo-500 opacity-80 group-hover:text-amber-500 transition-colors shrink-0 md:w-5 md:h-5" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs md:text-sm text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">{doc.name}</span>
                            {/* Waktu tampil di sini saat mobile */}
                            <span className="block md:hidden text-[10px] text-slate-500 mt-0.5">{doc.date}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-4 px-6 whitespace-nowrap">
                        <span className="text-sm text-slate-500">{doc.date}</span>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap">
                        <span className={getCategoryStyle(doc.category)}>
                          {doc.category}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell py-4 px-6 whitespace-nowrap">
                        <span className={getPriorityStyle(doc.priority)}>
                          {doc.priority}
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap text-right">
                        <button className="p-1.5 md:p-2 text-slate-400 group-hover:text-amber-500 rounded-lg transition-colors focus:outline-none bg-transparent hover:bg-slate-100 md:opacity-0 md:group-hover:opacity-100">
                          <MoreVertical size={18} className="md:w-5 md:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Side Drawer (Bottom Sheet on Mobile) */}
      {isDrawerOpen && selectedDoc && (
        <div className="relative z-[9999]">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-overlay transition-opacity" onClick={closeDrawer}></div>
          <div className="fixed bottom-0 md:top-0 right-0 h-[90vh] md:h-full w-full sm:w-[500px] bg-white shadow-2xl animate-slide-up md:animate-drawer flex flex-col rounded-t-2xl md:rounded-none">
            
            {/* Header */}
            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-slate-100 flex justify-between items-start bg-white rounded-t-2xl md:rounded-none relative">
              {/* Garis Handle Swipe untuk Mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full md:hidden"></div>
              
              <div className="pr-4 mt-2 md:mt-0">
                <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 md:mb-2">Detail Dokumen</p>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug break-words">{selectedDoc.name}</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                  <History size={14} className="md:w-4 md:h-4 text-slate-400"/> {selectedDoc.date}
                </p>
              </div>
              <button onClick={closeDrawer} className="mt-2 md:mt-0 p-2 md:p-2.5 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors focus:outline-none shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 bg-slate-50/50">
              {/* Kotak Informasi Kategori & Prioritas */}
              <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex flex-row gap-4 md:gap-8 justify-between md:justify-start">
                <div className="flex-1 md:flex-none">
                  <p className="text-[10px] md:text-xs font-semibold text-slate-400 mb-2 md:mb-3 uppercase tracking-wider">Kategori</p>
                  <span className={getCategoryStyle(selectedDoc.category)}>
                    {selectedDoc.category}
                  </span>
                </div>
                <div className="w-px bg-slate-200 hidden md:block"></div>
                <div className="flex-1 md:flex-none">
                  <p className="text-[10px] md:text-xs font-semibold text-slate-400 mb-2 md:mb-3 uppercase tracking-wider">Prioritas</p>
                  <div className="flex items-center gap-2.5">
                    <span className={getPriorityStyle(selectedDoc.priority)}>
                      {selectedDoc.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ringkasan */}
              {selectedDoc.summary && selectedDoc.summary.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 md:gap-2.5 mb-3 md:mb-5 text-amber-500">
                    <Zap size={18} className="md:w-5 md:h-5" fill="currentColor"/>
                    <h3 className="text-base md:text-lg font-bold text-slate-900">Intisari / Output AI</h3>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
                    <ul className="space-y-3 md:space-y-4">
                      {selectedDoc.summary.map((point, idx) => (
                        <li key={idx} className="flex gap-3 md:gap-4 items-start">
                          <Check className="text-amber-500 mt-0.5 shrink-0" size={16} strokeWidth={2.5} />
                          <span className="text-xs md:text-sm leading-relaxed text-slate-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-3 md:gap-4 pb-8 md:pb-6">
              <button 
                onClick={handleDelete} 
                className="p-2.5 md:p-3.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center border border-transparent hover:border-red-200" 
                title="Hapus dari Riwayat"
              >
                <Trash2 size={20} className="md:w-[22px] md:h-[22px]" />
              </button>
              
              <div className="flex gap-2 md:gap-3 flex-1">
                <Button variant="secondary" onClick={() => showToast('Ringkasan berhasil disalin ke clipboard!')} className="flex-1 py-2.5 md:py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium text-xs md:text-sm shadow-sm">
                  <Copy size={16} className="mr-1.5 md:mr-2 inline md:w-[18px] md:h-[18px]" /> Salin
                </Button>
                <Button onClick={() => showToast('Mulai mengunduh dokumen asli...')} className="flex-1 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs md:text-sm shadow-md shadow-amber-500/20">
                  <Download size={16} className="mr-1.5 md:mr-2 inline md:w-[18px] md:h-[18px]" /> Unduh
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
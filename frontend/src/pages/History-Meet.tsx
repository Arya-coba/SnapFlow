import { useState, useEffect } from 'react';
import { 
  Search, History, Check, Archive, X, Copy, Download, 
  Trash2, Users, Target, CheckSquare, Zap, Loader2, MoreVertical
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API } from '../utils/api';

type MeetingData = {
  id: number;
  name: string;
  date: string;
  ringkasan: string;
  topik: string[];
  keputusan: string[];
  tugas: { pic?: string; assignee?: string; tugas?: string; text?: string }[];
};

export default function RiwayatRapat() {
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMeetingHistory();
  }, []);

  const fetchMeetingHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API.historyMeetings}?limit=100`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || "Gagal mengambil riwayat rapat");

      if (result.success && result.data) {
        const formattedData = result.data.map((item: any) => {
          // ALAT PELACAK
          console.log("Data mentah dari DB:", item);

          // FUNGSI PARSE KEBAL PELURU
          let parsed: any = {};
          let rawData = item.data || item.result || item.hasil || item.meeting_data || item;

          try {
            if (typeof rawData === 'string') {
              parsed = JSON.parse(rawData);
              if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
              }
            } else {
              parsed = rawData;
            }
          } catch (e) {
            console.error("Gagal mengekstrak JSON dari database:", e);
          }

          const ringkasanText = parsed?.ringkasan || parsed?.data?.ringkasan || parsed?.summary || 'Tidak ada ringkasan';

          return {
            id: item.id,
            name: item.filename || item.name || 'Notulensi Rapat',
            date: item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Waktu tidak diketahui',
            ringkasan: ringkasanText,
            topik: parsed?.topik_utama || parsed?.data?.topik_utama || [],
            keputusan: parsed?.keputusan || parsed?.data?.keputusan || [],
            tugas: parsed?.action_items || parsed?.data?.action_items || [],
          };
        });
        
        setMeetings(formattedData);
      }
    } catch (error: any) {
      console.error(error);
      showToast("Gagal memuat riwayat rapat: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeeting) return;
    
    try {
      // await fetch(`http://127.0.0.1:8000/history/meetings/${selectedMeeting.id}`, { method: 'DELETE' });
      setMeetings(meetings.filter(m => m.id !== selectedMeeting.id));
      closeDrawer();
      showToast('Riwayat rapat berhasil dihapus dari tampilan.');
    } catch (error: any) {
      console.error(error);
      showToast("Gagal menghapus: " + error.message);
    }
  };

  const handleCopy = async () => {
    if (!selectedMeeting) return;
    let text = `HASIL NOTULENSI - ${selectedMeeting.name}\n\n`;
    text += `RINGKASAN:\n${selectedMeeting.ringkasan}\n\n`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Notulensi berhasil disalin!');
    } catch (err) {
      showToast('Gagal menyalin teks.');
    }
  };

  const filteredMeetings = meetings.filter(meet => 
    meet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meet.ringkasan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openDrawer = (meet: MeetingData) => { setSelectedMeeting(meet); setIsDrawerOpen(true); };
  const closeDrawer = () => { setIsDrawerOpen(false); setTimeout(() => setSelectedMeeting(null), 300); };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  return (
    <div className="font-sans"> 
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[9999] bg-white px-4 md:px-5 py-3 md:py-4 rounded-xl shadow-lg border-l-4 border-[#10B981] flex items-center gap-3 animate-toast max-w-[90vw] md:max-w-md">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0">
            <Check size={14} className="md:w-4 md:h-4" strokeWidth={3} />
          </div>
          <span className="text-xs md:text-sm font-medium text-[#2D3748]">{toast.message}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col pt-4 animate-slide-up relative h-full z-10 w-full">
        
        {/* Header & Pencarian */}
        <div className="mb-6 md:mb-8 relative z-20 px-4 md:px-0">
          <h1 className="text-2xl md:text-[28px] font-bold text-[#2D3748] mb-2">Riwayat Rapat</h1>
          <p className="text-[#718096] text-sm md:text-base max-w-2xl leading-relaxed">
            Tinjau kembali notulensi, keputusan penting, dan daftar tugas dari rapat-rapat sebelumnya.
          </p>
          
          <div className="mt-6 md:mt-8 bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full lg:w-1/2">
              <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-[#A0AEC0]">
                <Search size={18} className="md:w-5 md:h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Cari nama dokumen atau ringkasan..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-transparent text-[#2D3748] text-sm rounded-xl pl-10 md:pl-12 pr-4 py-2.5 md:py-3 focus:bg-white focus:border-[#F4A261]/50 focus:ring-4 focus:ring-[#F4A261]/10 outline-none transition-all placeholder-[#A0AEC0]"
              />
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <Card className="flex-1 flex flex-col relative z-10 bg-white border-gray-100 shadow-sm overflow-hidden rounded-2xl mx-4 md:mx-0">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <Loader2 size={40} className="text-[#F4A261] animate-spin mb-4 md:mb-6 md:w-12 md:h-12" />
              <h3 className="text-base md:text-lg font-semibold text-[#2D3748]">Memuat Riwayat Rapat...</h3>
              <p className="text-[#718096] text-xs md:text-sm mt-2">Menyinkronkan data dari server</p>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FDFBF7] rounded-full flex items-center justify-center mb-4 md:mb-6 border border-gray-100 shadow-sm">
                <Archive size={32} className="text-[#A0AEC0] md:w-10 md:h-10" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-[#2D3748] mb-2">Belum ada rapat yang diproses</h3>
              <p className="text-[#718096] text-sm md:text-base max-w-sm leading-relaxed">
                Mulai dengan menyalin transkrip rapat di halaman Asisten Rapat untuk melihat notulensinya di sini.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto custom-scrollbar h-full">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-gray-100">
                    <th className="py-3 md:py-4 px-4 md:px-6 text-[10px] md:text-xs font-bold tracking-wider text-[#718096] uppercase whitespace-nowrap">Nama Dokumen / Rapat</th>
                    {/* Sembunyikan kolom ini di mobile */}
                    <th className="hidden md:table-cell py-4 px-6 text-xs font-bold tracking-wider text-[#718096] uppercase whitespace-nowrap">Tanggal Diproses</th>
                    <th className="hidden lg:table-cell py-4 px-6 text-xs font-bold tracking-wider text-[#718096] uppercase whitespace-nowrap w-2/5">Preview Ringkasan</th>
                    <th className="py-3 md:py-4 px-4 md:px-6 text-[10px] md:text-xs font-bold tracking-wider text-[#718096] uppercase whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMeetings.map((meet) => (
                    <tr 
                      key={meet.id} 
                      onClick={() => openDrawer(meet)} 
                      className="hover:bg-[#F4A261]/5 transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="py-3 md:py-4 px-4 md:px-6 w-full md:w-auto">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="p-2 md:p-2.5 bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 text-[#A0AEC0] group-hover:text-[#F4A261] group-hover:border-[#F4A261]/30 transition-colors shrink-0">
                            <Users size={16} className="md:w-5 md:h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs md:text-sm text-[#2D3748] group-hover:text-[#F4A261] transition-colors line-clamp-1">{meet.name}</span>
                            {/* Tanggal muncul di bawah nama KHUSUS di mobile */}
                            <span className="block md:hidden text-[10px] text-[#718096] mt-0.5">{meet.date}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell py-4 px-6 whitespace-nowrap">
                        <span className="text-sm text-[#718096]">{meet.date}</span>
                      </td>
                      <td className="hidden lg:table-cell py-4 px-6">
                        <span className="text-sm text-[#4A5568] line-clamp-1 leading-relaxed max-w-md">{meet.ringkasan}</span>
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 whitespace-nowrap text-right">
                        <button className="p-1.5 md:p-2 text-[#A0AEC0] group-hover:text-[#F4A261] rounded-lg transition-colors focus:outline-none bg-transparent hover:bg-white md:opacity-0 md:group-hover:opacity-100">
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

      {/* Side Drawer (Pop-up Detail) */}
      {isDrawerOpen && selectedMeeting && (
        <div className="relative z-[9999]">
          <div className="fixed inset-0 bg-[#2D3748]/40 backdrop-blur-sm animate-overlay transition-opacity" onClick={closeDrawer}></div>
          <div className="fixed bottom-0 md:top-0 right-0 h-[90vh] md:h-full w-full sm:w-[600px] bg-white shadow-2xl animate-slide-up md:animate-drawer flex flex-col rounded-t-2xl md:rounded-none">
            
            {/* Header Drawer */}
            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-gray-100 flex justify-between items-start bg-white rounded-t-2xl md:rounded-none relative">
              {/* Handle untuk swipe down di mobile (visual saja) */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden"></div>
              
              <div className="pr-4 mt-2 md:mt-0">
                <p className="text-[10px] md:text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-1.5 md:mb-2">Detail Notulensi</p>
                <h2 className="text-lg md:text-xl font-bold text-[#2D3748] leading-snug break-words">{selectedMeeting.name}</h2>
                <p className="text-xs md:text-sm text-[#718096] mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
                  <History size={14} className="md:w-4 md:h-4 text-[#A0AEC0]"/> {selectedMeeting.date}
                </p>
              </div>
              <button onClick={closeDrawer} className="mt-2 md:mt-0 p-2 md:p-2.5 bg-[#FDFBF7] text-[#718096] hover:text-[#2D3748] hover:bg-gray-100 rounded-full transition-colors focus:outline-none shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            {/* Konten Drawer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 bg-[#FDFBF7]/50 space-y-6 md:space-y-8">
              
              {/* Ringkasan Inti */}
              <div>
                <div className="flex items-center gap-2 md:gap-2.5 mb-3 md:mb-4 text-[#F4A261]">
                  <div className="p-1 md:p-1.5 bg-[#F4A261]/10 rounded-md"><Zap size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor"/></div>
                  <h3 className="text-sm md:text-[16px] font-bold text-[#2D3748]">Ringkasan Inti Rapat</h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm">
                  <p className="text-xs md:text-[14px] leading-relaxed text-[#4A5568]">{selectedMeeting.ringkasan}</p>
                </div>
              </div>

              {/* Topik Utama (Chips) */}
              {selectedMeeting.topik.length > 0 && (
                <div>
                  <h3 className="text-[10px] md:text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 md:mb-3">Topik yang Dibahas</h3>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {selectedMeeting.topik.map((t, idx) => (
                      <span key={idx} className="px-2.5 md:px-3.5 py-1 md:py-1.5 bg-white text-[#D9774F] border border-[#F4A261]/20 text-xs md:text-[13px] font-semibold rounded-lg md:rounded-xl shadow-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {selectedMeeting.tugas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 md:gap-2.5 mb-3 md:mb-4 text-[#10B981]">
                    <div className="p-1 md:p-1.5 bg-[#10B981]/10 rounded-md"><Target size={16} className="md:w-[18px] md:h-[18px]" /></div>
                    <h3 className="text-sm md:text-[16px] font-bold text-[#2D3748]">Action Items (Tugas)</h3>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-sm">
                    {selectedMeeting.tugas.map((t, idx) => {
                      const taskText = t.tugas || t.text || 'Tugas tidak terdefinisi';
                      const taskPic = t.pic || t.assignee || 'Tim';

                      return (
                        <div key={idx} className="flex gap-3 md:gap-4 items-start p-3 md:p-4 hover:bg-[#FDFBF7] rounded-lg md:rounded-xl transition-colors border-b border-gray-50 last:border-0">
                          <div className="text-[#A0AEC0] mt-0.5 shrink-0">
                            <CheckSquare size={16} className="md:w-[18px] md:h-[18px]" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs md:text-[14px] leading-relaxed font-medium text-[#2D3748] block mb-1.5 md:mb-2">{taskText}</span>
                            <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 md:py-1 rounded-md bg-[#10B981]/10 text-[#10B981] text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                              @{taskPic}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex items-center justify-between gap-3 md:gap-4 pb-8 md:pb-6">
              <button 
                onClick={handleDelete} 
                className="p-2.5 md:p-3.5 text-[#E53E3E] hover:bg-[#FFF5F5] rounded-xl transition-colors flex items-center justify-center border border-transparent hover:border-[#FED7D7]" 
                title="Hapus dari Riwayat"
              >
                <Trash2 size={20} className="md:w-[22px] md:h-[22px]" />
              </button>
              
              <div className="flex gap-2 md:gap-3 flex-1">
                <Button variant="secondary" onClick={handleCopy} className="flex-1 py-2.5 md:py-3 bg-[#FDFBF7] text-[#4A5568] hover:bg-gray-100 hover:text-[#2D3748] border-none font-semibold text-xs md:text-sm shadow-sm flex items-center justify-center">
                  <Copy size={16} className="mr-2 inline md:w-[18px] md:h-[18px]" /> Salin Notulensi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
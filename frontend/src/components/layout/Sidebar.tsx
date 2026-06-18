import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Tags, FileText, ClipboardCheck,
  MessageSquare, History, Video
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const location = useLocation();
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Menutup popover riwayat jika klik di luar menu (untuk mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsMobileHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Menu Utama
  const coreMenuItems = [
    { id: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { id: '/klasifikasi', icon: <Tags size={22} />, label: 'Klasifikasi Dokumen' },
    { id: '/ringkasan', icon: <FileText size={22} />, label: 'Ringkasan AI' },
    { id: '/rapat', icon: <ClipboardCheck size={22} />, label: 'Asisten Rapat' },
    { id: '/qa', icon: <MessageSquare size={22} />, label: 'Tanya Dokumen (QA)' },
  ];

  // Menu Riwayat yang digabung untuk mobile
  const historyMenuItems = [
    { id: '/riwayat-rapat', icon: <Video size={20} />, label: 'Riwayat Rapat' },
    { id: '/riwayat-dokumen', icon: <History size={20} />, label: 'Riwayat Dokumen' },
  ];

  // Cek apakah salah satu halaman riwayat sedang aktif
  const isHistoryActive = historyMenuItems.some(item => location.pathname === item.id);

  return (
    <nav
      className={`fixed z-50 transition-all duration-300 ease-in-out
        /* 📱 Mobile Layout: Bottom Bar */
        bottom-0 left-0 w-full bg-[#FDFBF7]/95 backdrop-blur-[10px] shadow-[0_-8px_40px_rgba(0,0,0,0.06)] rounded-t-[24px] flex flex-row items-center justify-around px-2 py-3
        /* 💻 Desktop Layout: Sidebar */
        md:top-[20px] md:bottom-[20px] md:left-[20px] md:rounded-[24px] md:shadow-[0_8px_40px_rgba(0,0,0,0.06)] md:flex-col md:py-8 md:overflow-hidden md:justify-start
        ${isSidebarHovered ? 'md:w-[250px]' : 'md:w-[80px]'}`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      {/* LOGO (Hanya Desktop) */}
      <Link to="/" className="hidden md:flex items-center px-6 mb-12 w-full whitespace-nowrap">
        <div className="min-w-[32px] h-[32px] bg-[#F4A261]/10 rounded-lg flex items-center justify-center text-[#F4A261]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m8 17 4 4 4-4" />
          </svg>
        </div>
        <span className={`ml-4 font-bold text-[20px] text-[#2D3748] transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>
          SnapFlow
        </span>
      </Link>

      {/* CONTAINER MENU */}
      <div className="flex flex-row md:flex-col gap-1 md:gap-2 w-full justify-around md:justify-start items-center md:items-stretch">

        {/* Render Menu Utama */}
        {coreMenuItems.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <Link
              key={item.id}
              to={item.id}
              className="relative flex flex-col md:flex-row items-center justify-center md:justify-start px-3 md:px-6 py-2 md:py-3 cursor-pointer hover:bg-[#F4A261]/10 rounded-xl md:rounded-none transition-colors group"
            >
              {isActive && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[60%] bg-[#F4A261] rounded-r-md"></div>}
              <div className={`transition-colors ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#F4A261]'}`}>
                {item.icon}
              </div>
              <span className={`hidden md:block ml-5 font-semibold whitespace-nowrap transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'} ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#F4A261]'}`}>
                {item.label}
              </span>
              {isActive && <div className="md:hidden absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#F4A261]"></div>}
            </Link>
          );
        })}

        {/* 💻 DESKTOP ONLY: Render Riwayat Terpisah */}
        {historyMenuItems.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <Link
              key={item.id}
              to={item.id}
              className="hidden md:flex relative items-center px-6 py-3 cursor-pointer hover:bg-[#F4A261]/10 transition-colors group"
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[60%] bg-[#F4A261] rounded-r-md"></div>}
              <div className={`transition-colors ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#F4A261]'}`}>
                {item.icon}
              </div>
              <span className={`ml-5 font-semibold whitespace-nowrap transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'} ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#F4A261]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 📱 MOBILE ONLY: Tombol Riwayat Gabungan (Popover) */}
        <div className="md:hidden relative" ref={popoverRef}>
          <button
            onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
            className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-colors ${isHistoryActive ? 'text-[#F4A261]' : 'text-[#718096]'}`}
          >
            <History size={22} />
            {isHistoryActive && <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#F4A261]"></div>}
          </button>

          {/* Floating Menu Popover */}
          {isMobileHistoryOpen && (
            <div className="absolute bottom-16 right-0 bg-[#FDFBF7] shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-2xl p-2 flex flex-col gap-1 min-w-[160px] border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {historyMenuItems.map((item) => {
                const isActive = location.pathname === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.id}
                    onClick={() => setIsMobileHistoryOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'bg-[#F4A261]/10 text-[#F4A261]' : 'text-[#718096] active:bg-gray-50'}`}
                  >
                    {item.icon}
                    <span>{item.label.replace('Riwayat ', '')}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
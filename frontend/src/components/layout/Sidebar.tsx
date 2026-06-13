import { useState } from 'react';
import { LayoutDashboard, Tags, FileText, ClipboardCheck, MessageSquare, History, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Menggunakan Router

export default function Sidebar() {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const location = useLocation(); // Mendapatkan path URL aktif

  const menuItems = [
    { id: '/', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { id: '/klasifikasi', icon: <Tags size={22} />, label: 'Klasifikasi Dokumen' },
    { id: '/ringkasan', icon: <FileText size={22} />, label: 'Ringkasan AI' },
    { id: '/rapat', icon: <ClipboardCheck size={22} />, label: 'Asisten Rapat' },
    { id: '/qa', icon: <MessageSquare size={22} />, label: 'Tanya Dokumen (QA)' },
    { id: '/riwayat', icon: <History size={22} />, label: 'Riwayat' },
  ];

  return (
    <nav
      className={`fixed top-[20px] bottom-[20px] left-[20px] z-50 bg-white/80 backdrop-blur-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.06)] rounded-[24px] transition-all duration-300 ease-in-out flex flex-col py-8 overflow-hidden ${isSidebarHovered ? 'w-[250px]' : 'w-[80px]'}`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      <div className="flex items-center px-6 mb-12 w-full whitespace-nowrap">
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
      </div>

      <div className="flex flex-col gap-2 w-full">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.id;
          return (
            <Link key={item.id} to={item.id} className="relative flex items-center px-6 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors group">
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[60%] bg-[#F4A261] rounded-r-md"></div>}
              <div className={`min-w-[22px] transition-colors ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#4A5568]'}`}>
                {item.icon}
              </div>
              <span className={`ml-5 font-semibold whitespace-nowrap transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'} ${isActive ? 'text-[#F4A261]' : 'text-[#718096] group-hover:text-[#4A5568]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
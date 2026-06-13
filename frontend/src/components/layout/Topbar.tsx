import { useState, useEffect, useRef } from 'react';
import { Bell, Settings, LogOut } from 'lucide-react';

export default function Topbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  return (
    <>
      <div className="flex justify-end items-center mb-2 gap-4 relative z-40 w-full pt-6 pr-8">
        <button className="relative p-2.5 text-[#718096] hover:bg-white hover:shadow-sm rounded-full transition-all">
          <Bell size={20} strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#F4A261] border-2 border-[#FDFDF9] rounded-full"></span>
        </button>
        
        <div className="relative" ref={profileRef}>
          <img 
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=F4A261" 
            alt="Profile" 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full border border-gray-200 cursor-pointer hover:border-[#F4A261] hover:shadow-md transition-all active:scale-95" 
          />
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-2 animate-dropdown">
              <div className="px-4 py-3 border-b border-gray-50/80 mb-1">
                <p className="text-[14px] font-bold text-[#2D3748]">Admin Operasional</p>
                <p className="text-[12px] text-[#A0AEC0] mt-0.5">admin@snapflow.id</p>
              </div>
              <button onClick={() => { showToast('Pengaturan dinonaktifkan pada Mode Demo'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4A5568] hover:bg-[#F7FAFC] hover:text-[#F4A261] transition-colors">
                <Settings size={16} /> Pengaturan
              </button>
              <button onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#E53E3E]/90 hover:bg-[#FFF5F5] transition-colors mt-1">
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {toast.visible && (
        <div className="fixed top-6 right-6 z-[100] bg-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#F4A261] flex items-center gap-3 animate-toast">
          <div className="w-6 h-6 rounded-full bg-[#F4A261]/10 flex items-center justify-center text-[#F4A261]"><Settings size={14} strokeWidth={2.5} /></div>
          <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
        </div>
      )}
    </>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Un-comment ini kalau kamu pakai React Router

export default function Topbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true); // Biarkan true kalau mau ada titik oren di bell

  const navigate = useNavigate(); // Inisialisasi router

  const profileRef = useRef<HTMLDivElement | null>(null);

  // Menutup dropdown profil kalau klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (profileRef.current && target && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC DESTROY SESSION & LOGOUT ---
  const handleLogout = () => {
    setIsProfileOpen(false);

    // 1. Hapus token/data sesi di local storage
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();

    // 2. Tampilkan notif/alert (Opsional)
    console.log("Sesi diakhiri.");

    navigate('/login'); 
  };

  return (
    <div className="flex justify-end items-center gap-4 relative z-40 w-full pt-6 pr-8 bg-transparent">

      {/* 1. AREA NOTIFIKASI (Hanya Icon) */}
      <div className="relative">
        <button
          className="relative p-2.5 text-[#718096] hover:bg-white hover:shadow-sm rounded-full transition-all cursor-pointer"
          onClick={() => setHasUnreadNotif(false)} // Opsional: Klik icon untuk menghilangkan titik oren
        >
          <Bell size={20} strokeWidth={1.5} />
          {hasUnreadNotif && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#F4A261] border-2 border-[#FDFDF9] rounded-full"></span>
          )}
        </button>
      </div>

      {/* 2. AREA PROFIL (Info & Logout Saja) */}
      <div className="relative" ref={profileRef}>
        <img
          src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=F4A261"
          alt="Profile"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-10 h-10 rounded-full border border-gray-200 cursor-pointer hover:border-[#F4A261] hover:shadow-md transition-all active:scale-95"
        />

        {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-2 animate-dropdown z-50">
            {/* Header Info User */}
            <div className="px-4 py-3 border-b border-gray-50/80 mb-1">
              <p className="text-[14px] font-bold text-[#2D3748]">Admin Operasional</p>
              <p className="text-[12px] text-[#A0AEC0] mt-0.5">admin@snapflow.id</p>
            </div>

            {/* Tombol Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#E53E3E]/90 hover:bg-[#FFF5F5] transition-colors mt-1"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
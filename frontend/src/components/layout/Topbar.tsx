import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SnapFlowUser = {
  id?: number;
  name?: string;
  email?: string;
  picture?: string | null;
  role?: string;
};

export default function Topbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement | null>(null);

  const getUser = (): SnapFlowUser | null => {
    const userData = localStorage.getItem('snapflow_user');

    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;

      if (profileRef.current && target && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);

    // Hapus session SnapFlow
    localStorage.removeItem('snapflow_token');
    localStorage.removeItem('snapflow_user');
    localStorage.removeItem('snapflow_auth');

    // Hapus key lama kalau masih tersisa dari percobaan sebelumnya
    localStorage.removeItem('token');
    localStorage.removeItem('userData');

    sessionStorage.clear();

    console.log('Sesi diakhiri.');

    navigate('/login', { replace: true });
  };

  const userName = user?.name || 'SnapFlow User';
  const userEmail = user?.email || 'user@snapflow.id';

  const avatarUrl =
    user?.picture ||
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
      userEmail
    )}&backgroundColor=F4A261`;

  return (
    <div className="flex justify-end items-center gap-4 relative z-40 w-full pt-6 pr-8 bg-transparent">
      {/* 1. AREA NOTIFIKASI */}
      <div className="relative">
        <button
          className="relative p-2.5 text-[#718096] hover:bg-white hover:shadow-sm rounded-full transition-all cursor-pointer"
          onClick={() => setHasUnreadNotif(false)}
        >
          <Bell size={20} strokeWidth={1.5} />

          {hasUnreadNotif && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#F4A261] border-2 border-[#FDFDF9] rounded-full"></span>
          )}
        </button>
      </div>

      {/* 2. AREA PROFIL */}
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
              <p className="text-[14px] font-bold text-[#2D3748] truncate">
                {userName}
              </p>
              <p className="text-[12px] text-[#A0AEC0] mt-0.5 truncate">
                {userEmail}
              </p>
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
import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '../utils/api';

// ── Helper ambil user dari localStorage ──────────────────────────────────────
export function getSessionUser() {
    try {
        const raw = localStorage.getItem('snapflow_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getSessionToken(): string {
    return localStorage.getItem('snapflow_token') || '';
}

export default function Topbar() {
    const [isProfileOpen, setIsProfileOpen]   = useState(false);
    const [hasUnreadNotif, setHasUnreadNotif] = useState(true);
    const [user, setUser]                     = useState<{ nama: string; role: string; email: string; avatar_seed: string } | null>(null);

    const navigate    = useNavigate();
    const profileRef  = useRef<HTMLDivElement | null>(null);

    // Ambil data user dari localStorage saat mount
    useEffect(() => {
        const userData = getSessionUser();
        if (userData) setUser(userData);
    }, []);

    // Tutup dropdown kalau klik di luar
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

    // ── Logout ───────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        setIsProfileOpen(false);

        const token = getSessionToken();

        // Panggil endpoint logout ke backend (opsional, bersihkan session server-side)
        if (token && token !== 'guest') {
            try {
                await fetch(API.logout, {
                    method : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body   : JSON.stringify({ token }),
                });
            } catch {
                // Tidak masalah kalau gagal, tetap logout lokal
            }
        }

        // Hapus session lokal
        localStorage.removeItem('snapflow_token');
        localStorage.removeItem('snapflow_user');
        sessionStorage.clear();

        navigate('/login');
    };

    // Avatar URL dari DiceBear berdasarkan nama user
    const avatarSeed = user?.avatar_seed || user?.nama || 'User';
    const avatarUrl  = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=F4A261`;

    return (
        <div className="flex justify-end items-center gap-4 relative z-40 w-full pt-6 pr-8 bg-transparent">

            {/* Notifikasi */}
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

            {/* Profil */}
            <div className="relative" ref={profileRef}>
                <img
                    src={avatarUrl}
                    alt="Profile"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full border border-gray-200 cursor-pointer hover:border-[#F4A261] hover:shadow-md transition-all active:scale-95"
                />

                {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-2 z-50">

                        {/* Info User dari session */}
                        <div className="px-4 py-3 border-b border-gray-50/80 mb-1">
                            <p className="text-[14px] font-bold text-[#2D3748] truncate">
                                {user?.nama || 'Pengguna'}
                            </p>
                            <p className="text-[11px] text-[#F4A261] font-medium mt-0.5">
                                {user?.role || 'Guest'}
                            </p>
                            <p className="text-[11px] text-[#A0AEC0] mt-0.5 truncate">
                                {user?.email || ''}
                            </p>
                        </div>

                        {/* Logout */}
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

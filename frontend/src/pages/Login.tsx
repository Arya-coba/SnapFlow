import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, FileText, Sparkles, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isRemembered, setIsRemembered] = useState(false);
    
    // State tambahan untuk Error dan Toast
    const [errorMsg, setErrorMsg] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '' });
    
    const navigate = useNavigate();

    const showToast = (message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    };

    // 1. FUNGSI LOGIN STANDAR
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            navigate('/');
        }, 2000);
    };

    // 2. FUNGSI LOGIN GOOGLE (OAUTH 2.0)
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsGoogleLoading(true);
            setErrorMsg(''); // Reset error sebelumnya
            try {
                // Ambil data profil dari Google
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                
                // SKENARIO WHITELIST (Ganti dengan email asli kamu nanti)
                if (userInfo.email === 'riskiyahkya@gmail.com') {
                    navigate('/dashboard'); // Sukses masuk
                } else {
                    setIsGoogleLoading(false);
                    setErrorMsg('Akses ditolak. Email Anda tidak terdaftar sebagai karyawan internal SnapFlow.');
                }
            } catch (error) {
                setIsGoogleLoading(false);
                setErrorMsg('Gagal mengambil data autentikasi dari server Google.');
            }
        },
        onError: () => {
            setErrorMsg('Proses masuk dengan Google dibatalkan.');
        }
    });

    // 3. FUNGSI LOGIN TAMU (GUEST)
    const handleGuestLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            showToast('Masuk sebagai Tamu. Mengalihkan ke Dashboard...');
            setTimeout(() => navigate('/'), 1500);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#FDFDF9] flex w-full overflow-hidden relative">
            
            {/* Notifikasi Toast untuk Guest */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-[100] bg-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]"><Check size={14} strokeWidth={3} /></div>
                    <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
                </div>
            )}

            {/* =======================================
                AREA KIRI: Visual Split Screen (40%) 
                ======================================= */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-[#F4A261] to-[#FFCBA4] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white opacity-20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#E88D67] opacity-40 rounded-full blur-[80px]"></div>
                <div></div>

                {/* Ilustrasi "3D" Minimalis Tengah */}
                <div className="flex-1 flex items-center justify-center relative z-10 w-full">
                    <div className="relative w-72 h-72">
                        {/* Base shadow */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-56 h-40 bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg transform -skew-x-6"></div>
                        
                        {/* Dokumen 1 */}
                        <div className="absolute top-12 left-8 w-24 h-32 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] p-3 animate-float transform -rotate-12 border border-white/50 flex flex-col gap-2">
                            <div className="w-full h-2 bg-gray-100 rounded-full"></div>
                            <div className="w-3/4 h-2 bg-gray-100 rounded-full"></div>
                            <div className="mt-auto w-6 h-6 bg-[#F4A261]/20 rounded-md"></div>
                        </div>

                        {/* Dokumen 2 (Utama) */}
                        <div className="absolute top-4 right-10 w-28 h-36 bg-white/95 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.15)] p-4 animate-float-delayed transform rotate-6 border border-white/50 z-20 flex flex-col gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F4A261]/10 flex items-center justify-center text-[#F4A261]">
                                <FileText size={16} />
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full mt-2"></div>
                            <div className="w-5/6 h-2 bg-gray-100 rounded-full"></div>
                            <div className="w-1/2 h-2 bg-[#F4A261]/30 rounded-full"></div>
                        </div>

                        {/* Search Bar Float */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_-5px_25px_rgba(244,162,97,0.2)] z-30 flex items-end p-4 justify-between">
                            <div className="w-12 h-1 bg-white/70 rounded-full mb-1"></div>
                            <div className="w-4 h-4 bg-white/80 rounded-full mb-1 flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#F4A261] rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-white/70 text-sm font-medium tracking-wide flex items-center gap-2">
                        <Sparkles size={16} className="opacity-80" />
                        SnapFlow: AI Workplace Assistant
                    </p>
                </div>
            </div>

            {/* =======================================
                AREA KANAN: Form Login (60%) 
                ======================================= */}
            <div className="w-full lg:w-[60%] bg-white flex items-center justify-center p-6 sm:p-12 md:p-20 relative">
                <div className="w-full max-w-[420px]">
                    
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#F4A261]/10 rounded-xl flex items-center justify-center text-[#F4A261]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                    <path d="M12 12v9" />
                                    <path d="m8 17 4 4 4-4" />
                                </svg>
                            </div>
                            <h1 className="text-[28px] font-bold text-[#2D3748] tracking-tight">SnapFlow</h1>
                        </div>
                        <h2 className="text-2xl font-semibold text-[#2D3748] mb-2">Selamat Datang Kembali 👋</h2>
                        <p className="text-sm text-[#718096] font-normal">Silakan masuk untuk mengelola dokumen Anda.</p>
                    </div>

                    {/* Alert Pesan Error Google Auth */}
                    {errorMsg && (
                        <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium animate-slide-up text-center shadow-sm">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Input: Email */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-bold text-[#2D3748] tracking-wide">Email Perusahaan</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-[#A0AEC0] group-focus-within:text-[#F4A261] transition-colors" />
                                </div>
                                <input type="email" required placeholder="nama@perusahaan.com" className="w-full h-[48px] bg-[#F7FAFC] border border-transparent rounded-xl pl-11 pr-4 text-sm text-[#2D3748] placeholder-[#A0AEC0] outline-none transition-all duration-300 focus:bg-white focus:border-[#F4A261] focus:shadow-[0_0_0_4px_rgba(244,162,97,0.15)] hover:bg-gray-50" />
                            </div>
                        </div>

                        {/* Input: Password */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-bold text-[#2D3748] tracking-wide">Kata Sandi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-[#A0AEC0] group-focus-within:text-[#F4A261] transition-colors" />
                                </div>
                                <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full h-[48px] bg-[#F7FAFC] border border-transparent rounded-xl pl-11 pr-11 text-sm text-[#2D3748] placeholder-[#A0AEC0] outline-none transition-all duration-300 focus:bg-white focus:border-[#F4A261] focus:shadow-[0_0_0_4px_rgba(244,162,97,0.15)] hover:bg-gray-50" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A0AEC0] hover:text-[#2D3748] transition-colors focus:outline-none">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Ingat Saya & Lupa Sandi */}
                        <div className="flex items-center justify-between pt-1 pb-1">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer sr-only" checked={isRemembered} onChange={() => setIsRemembered(!isRemembered)} />
                                    <div className="w-4 h-4 bg-[#F7FAFC] border border-[#CBD5E0] rounded-[4px] flex items-center justify-center transition-all duration-200 peer-checked:bg-[#F4A261] peer-checked:border-[#F4A261] group-hover:border-[#F4A261]/50">
                                        <svg className={`w-3 h-3 text-white transform transition-transform duration-200 ${isRemembered ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="ml-2.5 text-sm text-[#718096] select-none group-hover:text-[#2D3748] transition-colors">Ingat Saya</span>
                            </label>
                            <a href="#" className="text-sm text-[#F4A261] font-medium hover:underline hover:text-[#E88D67] transition-all">Lupa Kata Sandi?</a>
                        </div>

                        {/* Tombol Login Utama */}
                        <Button 
                            type="submit" 
                            disabled={isLoading || isGoogleLoading} 
                            className="w-full h-[50px] group overflow-hidden relative"
                        >
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shine_1s] hidden group-hover:block" />
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="font-medium text-sm">Memproses...</span>
                                </div>
                            ) : "Masuk ke SnapFlow"}
                        </Button>
                        
                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-[#A0AEC0] text-[13px]">atau</span></div>
                        </div>

                        {/* Tombol Google */}
                        <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => handleGoogleLogin()} 
                            disabled={isLoading || isGoogleLoading}
                            className="w-full h-[50px] relative font-medium"
                        >
                            {isGoogleLoading ? (
                                <div className="w-5 h-5 border-2 border-[#E2E8F0] border-t-[#718096] rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    <span className="text-[15px] text-[#4A5568]">Masuk dengan Google</span>
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Akses Tamu (Guest) */}
                    <div className="mt-8 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <p className="text-[13px] text-[#718096]">
                            Hanya ingin memberikan evaluasi?{' '}
                            <button 
                                type="button" 
                                onClick={handleGuestLogin}
                                disabled={isLoading || isGoogleLoading}
                                className="font-bold text-[#F4A261] hover:text-[#E88D67] transition-colors hover:underline underline-offset-4 disabled:opacity-50"
                            >
                                Masuk sebagai Tamu
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
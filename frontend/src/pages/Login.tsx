import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, FileText, Sparkles, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import { API } from '../utils/api';

export default function Login() {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [isRemembered, setIsRemembered] = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');
    const [toast, setToast]               = useState({ visible: false, message: '' });

    const navigate = useNavigate();

    const showToast = (message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: '' }), 3000);
    };

    // ── Login utama via API ──────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            const response = await fetch(API.login, {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMsg(data.detail || 'Email atau password salah.');
                setIsLoading(false);
                return;
            }

            // Simpan session ke localStorage
            const userData = data.data;
            localStorage.setItem('snapflow_token', userData.token);
            localStorage.setItem('snapflow_user', JSON.stringify({
                email      : userData.email,
                nama       : userData.nama,
                role       : userData.role,
                avatar_seed: userData.avatar_seed,
            }));

            showToast(`Selamat datang, ${userData.nama}!`);
            setTimeout(() => navigate('/dashboard'), 1000);

        } catch (err) {
            setErrorMsg('Tidak bisa terhubung ke server. Pastikan backend berjalan.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Login tamu (tanpa auth) ──────────────────────────────────────────────
    const handleGuestLogin = () => {
        localStorage.setItem('snapflow_token', 'guest');
        localStorage.setItem('snapflow_user', JSON.stringify({
            email      : 'tamu@snapflow.id',
            nama       : 'Tamu',
            role       : 'Guest',
            avatar_seed: 'Guest',
        }));
        showToast('Masuk sebagai Tamu. Mengalihkan ke Dashboard...');
        setTimeout(() => navigate('/dashboard'), 1500);
    };

    return (
        <div className="min-h-screen bg-[#FDFDF9] flex w-full overflow-hidden relative">

            {/* Toast */}
            {toast.visible && (
                <div className="fixed top-6 right-6 z-[100] bg-white px-5 py-3.5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-l-4 border-[#38A169] flex items-center gap-3 animate-toast">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[#38A169]"><Check size={14} strokeWidth={3} /></div>
                    <span className="text-sm font-semibold text-[#2D3748]">{toast.message}</span>
                </div>
            )}

            {/* KIRI: Visual */}
            <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-[#F4A261] to-[#FFCBA4] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white opacity-20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#E88D67] opacity-40 rounded-full blur-[80px]"></div>
                <div></div>
                <div className="flex-1 flex items-center justify-center relative z-10 w-full">
                    <div className="relative w-72 h-72">
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-56 h-40 bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg transform -skew-x-6"></div>
                        <div className="absolute top-12 left-8 w-24 h-32 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] p-3 animate-float transform -rotate-12 border border-white/50 flex flex-col gap-2">
                            <div className="w-full h-2 bg-gray-100 rounded-full"></div>
                            <div className="w-3/4 h-2 bg-gray-100 rounded-full"></div>
                            <div className="mt-auto w-6 h-6 bg-[#F4A261]/20 rounded-md"></div>
                        </div>
                        <div className="absolute top-4 right-10 w-28 h-36 bg-white/95 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.15)] p-4 animate-float-delayed transform rotate-6 border border-white/50 z-20 flex flex-col gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F4A261]/10 flex items-center justify-center text-[#F4A261]">
                                <FileText size={16} />
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full mt-2"></div>
                            <div className="w-5/6 h-2 bg-gray-100 rounded-full"></div>
                            <div className="w-1/2 h-2 bg-[#F4A261]/30 rounded-full"></div>
                        </div>
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

            {/* KANAN: Form */}
            <div className="w-full lg:w-[60%] bg-white flex items-center justify-center p-6 sm:p-12 md:p-20 relative">
                <div className="w-full max-w-[420px]">

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#F4A261]/10 rounded-xl flex items-center justify-center text-[#F4A261]">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                    <path d="M12 12v9" /><path d="m8 17 4 4 4-4" />
                                </svg>
                            </div>
                            <h1 className="text-[28px] font-bold text-[#2D3748] tracking-tight">SnapFlow</h1>
                        </div>
                        <h2 className="text-2xl font-semibold text-[#2D3748] mb-2">Selamat Datang Kembali 👋</h2>
                        <p className="text-sm text-[#718096] font-normal">Silakan masuk untuk mengelola dokumen Anda.</p>
                    </div>

                    {/* Error */}
                    {errorMsg && (
                        <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium text-center shadow-sm">
                            {errorMsg}
                        </div>
                    )}

                    {/* Hint kredensial demo */}
                    <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
                        <strong>Demo:</strong> gunakan <code>admin@snapflow.id</code> / <code>snapflow2024</code>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-bold text-[#2D3748] tracking-wide">Email Perusahaan</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-[#A0AEC0] group-focus-within:text-[#F4A261] transition-colors" />
                                </div>
                                <input
                                    type="email" required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="nama@snapflow.id"
                                    className="w-full h-[48px] bg-[#F7FAFC] border border-transparent rounded-xl pl-11 pr-4 text-sm text-[#2D3748] placeholder-[#A0AEC0] outline-none transition-all duration-300 focus:bg-white focus:border-[#F4A261] focus:shadow-[0_0_0_4px_rgba(244,162,97,0.15)] hover:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="block text-[12px] font-bold text-[#2D3748] tracking-wide">Kata Sandi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-[#A0AEC0] group-focus-within:text-[#F4A261] transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'} required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-[48px] bg-[#F7FAFC] border border-transparent rounded-xl pl-11 pr-11 text-sm text-[#2D3748] placeholder-[#A0AEC0] outline-none transition-all duration-300 focus:bg-white focus:border-[#F4A261] focus:shadow-[0_0_0_4px_rgba(244,162,97,0.15)] hover:bg-gray-50"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A0AEC0] hover:text-[#2D3748] transition-colors focus:outline-none">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Ingat Saya */}
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
                        </div>

                        {/* Submit */}
                        <Button type="submit" disabled={isLoading} className="w-full h-[50px]">
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="font-medium text-sm">Memproses...</span>
                                </div>
                            ) : 'Masuk ke SnapFlow'}
                        </Button>
                    </form>

                    {/* Akses Tamu */}
                    <div className="mt-8 text-center">
                        <p className="text-[13px] text-[#718096]">
                            Hanya ingin mencoba?{' '}
                            <button
                                type="button"
                                onClick={handleGuestLogin}
                                disabled={isLoading}
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

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Play, CheckCircle2, MessageSquare, Tags,
  Menu, X, Database, Cpu, Layers, LayoutDashboard,
  FileText, Lock, Zap, Network, ClipboardCheck, Users, Check, ShieldCheck, Brain,
  Mail, Globe, Phone, MapPin, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const teamMembers = [
    { name: 'Arya Choirul Fikri', role: 'AI Project Lead & RAG Specialist' },
    { name: 'Muhammad Iqbal Faza', role: 'AI Enginer' },
    { name: 'Pradnya Aliya Maharani', role: 'AI Integration Engineer' },
    { name: 'Rizqiyah', role: 'AI Interface & Deployment Engineer' },
    { name: 'Ardian Gymnastiar', role: 'AI Enginer' },
  ];

  const faqs = [
    {
      q: "Apa itu SnapFlow dan untuk siapa aplikasi ini dirancang?",
      a: "SnapFlow adalah asisten AI berbasis Retrieval-Augmented Generation (RAG) yang dirancang untuk mengotomatisasi pemrosesan dokumen. Aplikasi ini sangat cocok untuk tim HR, IT, operasional, dan manajemen yang sering berurusan dengan klasifikasi dokumen, pencarian informasi dalam SOP, dan pembuatan notulensi rapat."
    },
    {
      q: "Apakah dokumen internal perusahaan saya aman?",
      a: "Sangat aman. SnapFlow beroperasi pada arsitektur terisolasi di mana dokumen Anda diproses menggunakan Vector Database lokal (FAISS) dan tidak pernah digunakan untuk melatih model bahasa AI publik. Selain itu, kami menerapkan hashing kriptografi untuk melindungi kredensial Anda."
    },
    {
      q: "Format dokumen apa saja yang didukung oleh fitur Tanya Dokumen (QA)?",
      a: "Saat ini, mesin RAG kami mendukung ekstraksi teks berkinerja tinggi dari format file PDF, DOCX, dan TXT dengan ukuran maksimal hingga 25MB per dokumen."
    },
    {
      q: "Bagaimana cara kerja fitur Asisten Rapat AI?",
      a: "Anda cukup mengunggah file transkrip rapat (berupa teks hasil rekaman Zoom atau Google Meet). AI kami akan menganalisis teks tersebut, mengidentifikasi poin-poin keputusan, dan otomatis membuatkan daftar tugas (Action Items) beserta penanggung jawabnya."
    },
    {
      q: "Apakah SnapFlow bisa diintegrasikan dengan sistem internal perusahaan?",
      a: "Ya. SnapFlow dibangun menggunakan arsitektur backend FastAPI yang sangat fleksibel dan modular, sehingga memungkinkan integrasi API langsung ke sistem ERP atau platform manajemen tugas perusahaan Anda (seperti Jira atau Trello) di masa mendatang."
    }
  ];

  const toggleFaq = (index: any) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDF9] font-sans overflow-x-hidden selection:bg-[#F4A261]/30 selection:text-[#2D3748]">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .glass-pill {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-fast {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 2s; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite 1s; }
      `}} />

      {/* =======================================
          1. HEADER / NAVBAR (FLOATING PILL STYLE)
          ======================================= */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 pt-6 px-4 sm:px-6 lg:px-8`}>
        <div className={`max-w-6xl mx-auto h-16 flex justify-between items-center px-6 rounded-full transition-all duration-500 ${scrolled ? 'glass-pill' : 'bg-transparent'}`}>
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-[#F4A261]/10 rounded-xl flex items-center justify-center text-[#F4A261]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
            </div>
            <span className="font-extrabold text-xl text-[#2D3748] tracking-tight">SnapFlow</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-[14px] font-bold text-[#4A5568] hover:text-[#F4A261] transition-colors">Fitur</a>
            <a href="#arsitektur" className="text-[14px] font-bold text-[#4A5568] hover:text-[#F4A261] transition-colors">Keamanan</a>
            <a href="#tim" className="text-[14px] font-bold text-[#4A5568] hover:text-[#F4A261] transition-colors">Tim Kami</a>
            <a href="#faq" className="text-[14px] font-bold text-[#4A5568] hover:text-[#F4A261] transition-colors">FAQ</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-[#4A5568] hover:bg-gray-100 rounded-full transition-colors">
              Masuk
            </a>
            <a href="/login" className="px-5 py-2.5 bg-[#F4A261] text-white text-[14px] font-bold rounded-full hover:bg-[#E88D67] hover:shadow-[0_8px_20px_rgba(244,162,97,0.3)] hover:-translate-y-0.5 transition-all duration-300">
              Coba Gratis
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-[#4A5568] p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-24 left-4 right-4 bg-white rounded-2xl shadow-xl py-4 px-4 flex flex-col gap-2 border border-gray-100">
            <a href="#fitur" className="font-bold text-[#4A5568] p-3 hover:bg-gray-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Fitur</a>
            <a href="#arsitektur" className="font-bold text-[#4A5568] p-3 hover:bg-gray-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Keamanan</a>
            <a href="#tim" className="font-bold text-[#4A5568] p-3 hover:bg-gray-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Tim Pengembang</a>
            <a href="#faq" className="font-bold text-[#4A5568] p-3 hover:bg-gray-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <div className="h-[1px] bg-gray-100 my-2"></div>
            <a href="#" className="w-full px-4 py-3 bg-[#F4A261] text-white text-center font-bold rounded-xl">Coba Gratis</a>
          </div>
        )}
      </header>

      {/* =======================================
          2. HERO SECTION
          ======================================= */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-32 px-4 overflow-hidden">
        {/* Latar Belakang Dekoratif */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#F4A261] opacity-[0.06] rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-[#E88D67] opacity-[0.05] rounded-full blur-[80px]"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[12px] font-bold mb-6 animate-float-fast">
            <Sparkles size={14} /> Ubah Cara Kerja Anda
          </div>
          <h1 className="text-4xl md:text-[64px] font-extrabold text-[#2D3748] tracking-tight leading-[1.1] mb-6">
            Otomasi Ruang Kerja. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4A261] to-[#E88D67]">Lebih Cepat, Tanpa Kesalahan.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#718096] mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
            SnapFlow adalah asisten AI ruang kerja cerdas berbasis <strong>Retrieval-Augmented Generation (RAG)</strong>. Ekstrak ringkasan, klasifikasi ribuan dokumen internal, dan temukan jawaban akurat secara real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-[#F4A261] text-white text-[16px] font-bold rounded-full hover:bg-[#E88D67] hover:shadow-[0_10px_25px_rgba(244,162,97,0.35)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
              <LayoutDashboard size={20} /> Masuk ke Aplikasi
            </button>
            <a href="#" className="w-full sm:w-auto px-8 py-4 bg-white text-[#4A5568] border-2 border-gray-200 text-[16px] font-bold rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
              <Play size={20} className="text-[#F4A261] fill-[#F4A261]/20" /> Tonton Video Demo
            </a>
          </div>

          {/* Statistik */}
          <div className="flex justify-center items-center gap-8 md:gap-16 border-t border-gray-200/60 pt-8 max-w-2xl mx-auto">
            <div>
              <h4 className="text-2xl md:text-3xl font-extrabold text-[#2D3748]">10k+</h4>
              <p className="text-[13px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Dokumen Diproses</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <h4 className="text-2xl md:text-3xl font-extrabold text-[#2D3748]">99%</h4>
              <p className="text-[13px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Akurasi Pencarian</p>
            </div>
            <div className="w-px h-10 bg-gray-200 hidden md:block"></div>
            <div className="hidden md:block">
              <h4 className="text-2xl md:text-3xl font-extrabold text-[#2D3748]">50+</h4>
              <p className="text-[13px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Tim Aktif</p>
            </div>
          </div>
        </div>

        {/* Hero Visual (CSS Mockup) */}
        <div className="max-w-5xl mx-auto mt-16 relative z-10 perspective-1000">
          <div className="hidden lg:flex absolute top-20 -left-12 bg-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 items-center gap-3 animate-float-fast z-20">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Status</p>
              <p className="text-[14px] font-bold text-[#2D3748]">Klasifikasi Selesai</p>
            </div>
          </div>

          <div className="hidden lg:flex absolute top-40 -right-12 bg-white px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 items-center gap-3 animate-float-delayed z-20">
            <div className="w-8 h-8 rounded-full bg-[#F4A261]/20 flex items-center justify-center text-[#F4A261]">
              <Brain size={16} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Engine RAG</p>
              <p className="text-[14px] font-bold text-[#2D3748]">Ringkasan Groq Aktif</p>
            </div>
          </div>

          <div className="relative rounded-t-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-200/60 bg-white/50 backdrop-blur-sm transform rotateX-2 animate-float">
            <div className="w-full bg-white/80 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="mx-auto w-64 h-6 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 font-medium">app.snapflow.local</span>
              </div>
            </div>
            <div className="flex h-[400px] bg-[#FDFDF9]">
              <div className="w-1/4 max-w-[200px] border-r border-gray-100 p-4 hidden sm:block bg-white/50">
                <div className="w-full h-8 bg-gray-100 rounded-lg mb-6"></div>
                <div className="space-y-3">
                  <div className="w-full h-6 bg-[#F4A261]/20 rounded-md"></div><div className="w-3/4 h-6 bg-gray-100 rounded-md"></div><div className="w-5/6 h-6 bg-gray-100 rounded-md"></div><div className="w-4/5 h-6 bg-gray-100 rounded-md"></div>
                </div>
              </div>
              <div className="flex-1 p-6 relative overflow-hidden bg-white/30">
                <div className="flex justify-between items-end mb-6">
                  <div><div className="w-48 h-6 bg-gray-200 rounded-md mb-2"></div><div className="w-64 h-4 bg-gray-100 rounded-md"></div></div>
                  <div className="w-10 h-10 rounded-full bg-[#F4A261]/15"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div className="w-8 h-8 rounded-full bg-indigo-100 mb-3"></div><div className="w-1/2 h-4 bg-gray-200 rounded"></div></div>
                  <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div className="w-8 h-8 rounded-full bg-emerald-100 mb-3"></div><div className="w-1/2 h-4 bg-gray-200 rounded"></div></div>
                  <div className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 p-4"><div className="w-8 h-8 rounded-full bg-blue-100 mb-3"></div><div className="w-1/2 h-4 bg-gray-200 rounded"></div></div>
                </div>
                <div className="absolute bottom-4 right-4 w-[300px] h-[200px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-gray-100 p-4 flex flex-col">
                  <div className="flex-1 space-y-3"><div className="self-end w-3/4 h-8 bg-blue-100 rounded-xl rounded-br-sm ml-auto"></div><div className="self-start w-5/6 h-12 bg-gray-50 rounded-xl rounded-bl-sm border border-gray-100"></div></div>
                  <div className="w-full h-8 bg-gray-50 rounded-lg mt-3 border border-gray-200"></div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#FDFDF9] to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* =======================================
          3. TECH STACK SHOWCASE
          ======================================= */}
      <section className="py-10 border-b border-gray-100 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-gray-400 tracking-wider mb-8 uppercase">Didukung oleh Teknologi AI Terbaik</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {[
              { name: "Vite", icon: Layers },
              { name: "FastAPI", icon: Zap },
              { name: "IndoBERT & SVM", icon: Cpu },
              { name: "FAISS", icon: Network },
              { name: "Groq API", icon: Brain },
              { name: "SQLite", icon: Database }
            ].map((tech, i) => (
              <div key={i} className="group flex items-center gap-2 font-bold text-xl text-[#718096] grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:text-[#F4A261] transition-all duration-300 cursor-default">
                <tech.icon size={24} className="group-hover:text-[#F4A261] transition-colors" />
                {tech.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =======================================
          4. FITUR UTAMA (ZIGZAG LAYOUT)
          ======================================= */}
      <section id="fitur" className="py-24 bg-[#FDFDF9] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

          {/* Fitur 1: Klasifikasi */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Tags size={28} /></div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748] leading-tight">Klasifikasi & Prioritas Otomatis.</h2>
              <p className="text-lg text-[#718096] leading-relaxed font-medium">
                Didukung oleh komparasi model <strong>IndoBERT dan SVM</strong>. Sistem tidak hanya menyortir kategori dan urgensi dokumen, tetapi juga langsung melakukan routing otomatis ke divisi terkait saat dokumen diunggah.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-3 text-[#4A5568] font-semibold"><CheckCircle2 className="text-indigo-500" size={20} /> Akurasi kategorisasi tinggi</li>
                <li className="flex items-center gap-3 text-[#4A5568] font-semibold"><CheckCircle2 className="text-indigo-500" size={20} /> Routing antar divisi real-time</li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl transform rotate-3"></div>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 relative z-10 animate-float">
                <div className="space-y-4">
                  {[
                    { title: "Keluhan_Jaringan_Lt3.txt", cat: "Tiket IT", prio: "Tinggi", cCol: "bg-indigo-50 text-indigo-600", pCol: "bg-red-50 text-red-600" },
                    { title: "SOP_Pengajuan_Cuti.pdf", cat: "SOP HR", prio: "Rendah", cCol: "bg-gray-100 text-gray-600", pCol: "bg-emerald-50 text-emerald-600" },
                    { title: "Invoice_Vendor_AWS.pdf", cat: "Laporan Keuangan", prio: "Sedang", cCol: "bg-indigo-50 text-indigo-600", pCol: "bg-amber-50 text-amber-600" },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#FDFDF9] rounded-2xl border border-gray-100 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-indigo-500 opacity-70" />
                        <span className="font-bold text-[14px] text-[#2D3748] truncate max-w-[150px]">{doc.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md ${doc.cCol}`}>{doc.cat}</span>
                        <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md ${doc.pCol}`}>{doc.prio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fitur 2: Ringkasan */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><FileText size={28} /></div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748] leading-tight">Ringkasan Cerdas Instan.</h2>
              <p className="text-lg text-[#718096] leading-relaxed font-medium">
                Tidak perlu membaca berhalaman-halaman. Menggunakan engine <strong>Groq AI</strong>, sistem mengekstrak esensi dokumen menjadi 3-5 poin penting yang sangat mudah dipahami dalam hitungan detik.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl transform -rotate-3"></div>
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative z-10 animate-float-delayed flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                  <Sparkles size={20} className="text-emerald-500" />
                  <h3 className="font-extrabold text-[#2D3748]">Intisari Dokumen: SOP Pengadaan</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Proses pengadaan di atas Rp 50 Juta wajib melampirkan minimal 3 kuotasi harga dari vendor berbeda.",
                    "Persetujuan akhir untuk budget di atas Rp 200 Juta harus ditandatangani oleh CFO.",
                    "Vendor yang terpilih wajib melewati proses Due Diligence selama 5 hari kerja sebelum PO diterbitkan."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={14} className="text-emerald-600 font-bold" />
                      </div>
                      <span className="text-[14px] font-medium leading-relaxed text-[#4A5568]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Fitur 3: RAG QA */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><MessageSquare size={28} /></div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748] leading-tight">Tanya Dokumen (RAG QA).</h2>
              <p className="text-lg text-[#718096] leading-relaxed font-medium">
                Tanya langsung ke dokumen Anda menggunakan arsitektur <strong>RAG</strong> dan <strong>FAISS Vector Store</strong>. Jawaban 100% merujuk pada teks referensi lokal, bebas dari halusinasi AI.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-3xl transform rotate-3"></div>
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-gray-100 relative z-10 animate-float flex flex-col gap-5">
                <div className="self-end max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-br-sm shadow-sm">
                  <p className="text-[14px] font-semibold">Berapa batas persetujuan Manajer untuk pengadaan?</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FDFDF9] border border-gray-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Zap size={18} /></div>
                  <div className="bg-[#FDFDF9] border border-gray-100 p-5 rounded-2xl rounded-tl-sm self-start max-w-[90%]">
                    <p className="text-[14px] text-[#4A5568] leading-relaxed font-medium">
                      Berdasarkan <strong className="text-[#2D3748] bg-blue-50 px-1 rounded">SOP_Pengadaan.pdf (Hal. 4)</strong>, pengadaan di bawah Rp 50 Juta cukup disetujui oleh Manajer Departemen terkait. Untuk Rp 50 Juta - Rp 200 Juta memerlukan persetujuan VP.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =======================================
          5. KEAMANAN DATA (DARK MODE)
          ======================================= */}
      <section id="arsitektur" className="py-24 bg-[#0F172A] border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Keamanan Data & Integritas Prototipe
            </h2>
            <p className="text-[#94A3B8] text-lg font-medium">
              Infrastruktur SnapFlow dirancang dengan mempertimbangkan privasi dokumen perusahaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-[#1E293B] border border-gray-700/50 p-8 rounded-3xl hover:border-[#F4A261]/50 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                <Database className="text-[#F4A261] opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-300" size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Penyimpanan Riwayat Lokal</h3>
              <p className="text-[#94A3B8] leading-relaxed text-[15px] font-medium">Penggunaan SQLite memastikan seluruh riwayat pemrosesan dan dokumen tersimpan aman di environment lokal/server Anda sendiri tanpa bocor ke publik.</p>
            </div>

            <div className="bg-[#1E293B] border border-gray-700/50 p-8 rounded-3xl hover:border-[#F4A261]/50 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="text-[#F4A261] opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-300" size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Kredensial Terlindungi</h3>
              <p className="text-[#94A3B8] leading-relaxed text-[15px] font-medium">Penerapan hashing kriptografi (Bcrypt) untuk seluruh sandi pengguna di database. Keamanan autentikasi sudah dipikirkan sejak fase prototipe.</p>
            </div>

            <div className="bg-[#1E293B] border border-gray-700/50 p-8 rounded-3xl hover:border-[#F4A261]/50 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-[#F4A261] opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-300" size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Pemrosesan Teks Aman</h3>
              <p className="text-[#94A3B8] leading-relaxed text-[15px] font-medium">Integrasi API LLM (Groq) yang terisolasi lewat backend FastAPI, menjaga routing data (System Prompts) tetap tertutup dan terkontrol dari sisi server.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================
          6. TIM PENGEMBANG (TEAM)
          ======================================= */}
      <section id="tim" className="py-24 bg-[#FDFDF9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748] mb-4">Meet the Innovators</h2>
            <p className="text-[#718096] text-lg font-medium">Tim ahli di balik perancangan dan integrasi asisten AI SnapFlow.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="w-[280px] bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-2 hover:border-[#F4A261]/30 hover:shadow-[0_10px_40px_rgba(244,162,97,0.12)] transition-all duration-300 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-5 border border-gray-200 shadow-inner">
                  <span className="text-[#2D3748] font-extrabold text-2xl">{member.name.charAt(0)}</span>
                </div>
                <h3 className="font-extrabold text-[#2D3748] text-[16px] mb-1">{member.name}</h3>
                <p className="text-[#F4A261] font-bold text-[13px]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =======================================
          7. FAQ SECTION
          ======================================= */}
      <section id="faq" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748] mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-[#718096] text-lg font-medium">Cari tahu lebih lanjut tentang bagaimana SnapFlow bekerja.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden bg-[#FDFDF9] transition-all duration-300 hover:border-[#F4A261]/50">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                >
                  <span className={`font-bold text-[16px] pr-4 ${openFaq === index ? 'text-[#F4A261]' : 'text-[#2D3748]'}`}>
                    {faq.q}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === index ? 'bg-[#F4A261]/10 text-[#F4A261] rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                    <ChevronDown size={18} strokeWidth={3} />
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out px-6 ${openFaq === index ? 'max-h-[500px] opacity-100 pb-5' : 'max-h-0 opacity-0 pb-0'}`}
                >
                  <p className="text-[#4A5568] leading-relaxed text-[15px] font-medium border-t border-gray-100 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =======================================
          8. CTA PENUTUP 
          ======================================= */}
      <section className="bg-gradient-to-br from-[#F4A261] to-[#E88D67] py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Siap mengeksplorasi otomasi ruang kerja masa depan?
          </h2>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Akses langsung ke prototipe interaktif SnapFlow dan rasakan efisiensi pemrosesan dokumen berbasis AI.
          </p>
          <a href="#" className="inline-block px-10 py-4 bg-white text-[#E88D67] text-[18px] font-extrabold rounded-full hover:bg-gray-50 hover:scale-105 hover:shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all duration-300">
            Jalankan Demo Sekarang
          </a>
        </div>
      </section>

      {/* =======================================
          9. MEGA FOOTER
          ======================================= */}
      <footer className="bg-[#0F172A] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#F4A261]/10 rounded-xl flex items-center justify-center text-[#F4A261]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m8 17 4 4 4-4" />
                  </svg>
                </div>
                <span className="font-extrabold text-2xl text-white tracking-tight">SnapFlow</span>
              </div>
              <p className="text-[#94A3B8] text-[14px] leading-relaxed font-medium">Memberdayakan ruang kerja masa depan melalui ekstraksi dokumen berbasis AI dan pemrosesan yang otomatis, aman, dan dapat diandalkan.</p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-white hover:bg-[#F4A261] transition-colors"><Mail size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-white hover:bg-[#F4A261] transition-colors"><Globe size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center text-white hover:bg-[#F4A261] transition-colors"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg></a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-[18px] mb-6">Tautan Cepat</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">Beranda</a></li>
                <li><a href="#fitur" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">Fitur</a></li>
                <li><a href="#arsitektur" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">Keamanan Data</a></li>
                <li><a href="#faq" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-[18px] mb-6">Layanan</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">Klasifikasi Dokumen</a></li>
                <li><a href="#" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">RAG Question Answering</a></li>
                <li><a href="#" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">Meeting Summarizer</a></li>
                <li><a href="#" className="text-[#94A3B8] font-medium hover:text-[#F4A261] transition-colors text-[15px]">API Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-[18px] mb-6">Kontak & Info</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3"><Mail className="text-[#F4A261] shrink-0 mt-0.5" size={18} /><span className="text-[#94A3B8] font-medium text-[15px]">hello@snapflow.ai</span></li>
                <li className="flex items-start gap-3"><Phone className="text-[#F4A261] shrink-0 mt-0.5" size={18} /><span className="text-[#94A3B8] font-medium text-[15px]">+62 812 3456 7890</span></li>
                <li className="flex items-start gap-3"><MapPin className="text-[#F4A261] shrink-0 mt-0.5" size={18} /><span className="text-[#94A3B8] font-medium text-[15px]">Program Pijar x IBM SkillsBuild (PJK-GM102)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#64748B] text-[14px] font-medium text-center md:text-left">© 2024 SnapFlow. Dikembangkan untuk Capstone Project.</p>
            <div className="flex gap-6">
              <a href="#" className="text-[#64748B] hover:text-white text-[14px] font-medium transition-colors">Kebijakan Privasi</a>
              <a href="#" className="text-[#64748B] hover:text-white text-[14px] font-medium transition-colors">Syarat Layanan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
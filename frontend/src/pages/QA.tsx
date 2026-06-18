import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileCode2, Search, Download, Send, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API } from '../utils/api';

// Asumsi endpoint FastAPI Anda

export default function QA() {
  const [appState, setAppState] = useState<'idle' | 'chat'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [documentText, setDocumentText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const processFile = (file: File) => {
    setDocumentName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textContent = e.target?.result as string;
      setDocumentText(textContent); 
      await indexDocumentToBackend(file.name, textContent);
    };
    reader.readAsText(file);
  };

  // --- LOGIKA FILE UPLOAD & INDEXING ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const indexDocumentToBackend = async (fileName: string, text: string) => {
    setAppState('chat');
    setIsTyping(true); // Tampilkan indikator loading saat indexing
    setMessages([]);

    try {
      const response = await fetch(API.qaIndex, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks: text, doc_id: fileName }),
      });

      const result = await response.json();

      setIsTyping(false);

      if (response.ok && result.success) {
        setMessages([{
          id: Date.now(),
          sender: 'ai',
          text: `Halo! Dokumen **${fileName}** berhasil diproses dan di-index (${result.chunks} potongan teks). Apa yang ingin Anda tanyakan?`
        }]);
      } else {
        throw new Error(result.error || "Gagal meng-index dokumen.");
      }
    } catch (error: any) {
      setIsTyping(false);
      setMessages([{
        id: Date.now(),
        sender: 'ai',
        html: true,
        text: `<span class="text-red-500 font-medium">Maaf, terjadi kesalahan saat memproses dokumen: ${error.message}</span>`
      }]);
    }
  };

  // --- LOGIKA TANYA JAWAB (Q&A) ---
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userQuestion = inputValue;

    // Tambahkan pesan user ke UI
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userQuestion }]);
    setInputValue('');
    setIsTyping(true); // AI mulai "berpikir"

    try {
      const response = await fetch(API.qaAsk, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuestion }),
      });

      const result = await response.json();
      setIsTyping(false);

      if (response.ok && result.success) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          html: false, // Gunakan false agar Regex **bold** Anda bekerja
          text: result.answer
        }]);
      } else {
        throw new Error(result.error || "Gagal mendapatkan jawaban.");
      }
    } catch (error: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        html: true,
        text: `<span class="text-red-500 font-medium flex items-center gap-2"><AlertCircle size={16}/> Terjadi kesalahan server: ${error.message}</span>`
      }]);
    }
  };

  return (
    <>
      {appState === 'idle' && (
        <div className="flex-1 flex flex-col animate-slide-up pb-10 px-4 md:px-0">
          
          <div className="mb-6 md:mb-5 text-center mt-4 md:mt-0">
            <h1 className="text-2xl md:text-[28px] font-bold text-[#2D3748] tracking-tight mb-2">Tanya Dokumen (QA)</h1>
            <p className="text-[#718096] text-sm md:text-base max-w-2xl mx-auto">
              Unggah dokumen atau pedoman perusahaan, lalu tanyakan apa saja.
            </p>
          </div>

          <div className="flex-1 flex justify-center relative w-full">
            {/* Input file tersembunyi */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.md,.csv" // Batasi format untuk sementara
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full max-w-full md:max-w-[80%] lg:max-w-[60%] aspect-square md:aspect-[16/9] max-h-[400px] border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center p-6 md:p-8 transition-all duration-300 ease-in-out cursor-pointer ${isDragOver
                ? 'border-[#F4A261] bg-[#F4A261]/[0.05] scale-[1.02] shadow-xl'
                : 'border-[#CBD5E0] bg-white hover:border-[#F4A261]/50 hover:bg-gray-50/50'
                }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#F7FAFC] flex items-center justify-center mb-4 md:mb-6 transition-transform duration-300 border border-gray-100 ${isDragOver ? 'scale-110 text-[#F4A261]' : 'text-[#A0AEC0]'}`}>
                <UploadCloud size={36} strokeWidth={1.5} className="md:w-10 md:h-10" />
              </div>

              <h3 className="text-base md:text-[18px] font-medium text-[#2D3748] mb-2 pointer-events-none text-center">
                Tarik & Lepas file di sini
              </h3>
              <p className="text-xs md:text-sm text-[#718096] mb-6 md:mb-8 pointer-events-none text-center">
                Mendukung TXT, MD (Maks. 25MB)
              </p>

              <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                Browse File
              </Button>
            </div>
          </div>
        </div>
      )}

      {appState === 'chat' && (
        <div className="flex-1 flex flex-col h-[calc(100vh-100px)] animate-slide-up px-4 md:px-0">
          
          <div className="mb-4 md:mb-6 mt-2 md:mt-0">
            <h1 className="text-xl md:text-[24px] font-bold text-[#2D3748]">Tanya Dokumen (QA)</h1>
          </div>
          
          {/* Di layar HP (flex-col) dokumen di atas, chat di bawah. Di layar Desktop (lg:flex-row) bersebelahan */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden h-full pb-4">

            {/* Viewer - Kiri di Desktop, Atas di Mobile */}
            <Card className="w-full lg:w-1/2 flex flex-col h-1/2 lg:h-full !bg-[#F7FAFC]">
              <div className="px-4 md:px-5 py-3 md:py-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                  <div className="p-1.5 md:p-2 bg-[#F4A261]/10 text-[#F4A261] rounded-lg shrink-0"><FileCode2 size={16} className="md:w-[18px] md:h-[18px]" /></div>
                  <span className="font-semibold text-[#2D3748] text-xs md:text-sm truncate">{documentName}</span>
                </div>
                <div className="flex gap-1 md:gap-2 shrink-0">
                  <button className="p-1.5 md:p-2 text-[#A0AEC0] hover:text-[#4A5568] hover:bg-gray-50 rounded-md"><Search size={16} /></button>
                  <button className="p-1.5 md:p-2 text-[#A0AEC0] hover:text-[#4A5568] hover:bg-gray-50 rounded-md"><Download size={16} /></button>
                </div>
              </div>
              <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar flex justify-center">
                <div className="w-full h-max bg-white rounded-lg shadow-sm border border-[#F4A261]/30 p-4 md:p-8">
                  {documentText ? (
                    <div className="text-xs md:text-[14px] leading-relaxed text-[#4A5568] whitespace-pre-wrap">
                      {documentText}
                    </div>
                  ) : (
                    <>
                      <div className="w-3/4 h-6 md:h-8 bg-gray-200 rounded mb-4 md:mb-6 animate-pulse"></div>
                      <div className="space-y-2 md:space-y-3 mb-8 animate-pulse">
                        <div className="h-3 md:h-4 bg-gray-100 rounded"></div>
                        <div className="h-3 md:h-4 bg-gray-100 rounded w-5/6"></div>
                        <div className="h-3 md:h-4 bg-gray-100 rounded w-4/6"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Chat - Kanan di Desktop, Bawah di Mobile */}
            <Card className="w-full lg:w-1/2 flex flex-col relative h-1/2 lg:h-full">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 md:space-y-6 pb-[100px] md:pb-[120px]">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#F4A261]/10 text-[#F4A261] flex items-center justify-center mr-2 md:mr-3 mt-1 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[15px] md:h-[15px]">
                          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                          <path d="M12 12v9" />
                          <path d="m8 17 4 4 4-4" />
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 text-sm md:text-[15px] leading-relaxed ${msg.sender === 'user' ? 'bg-[#FCEADA] text-[#2D3748] rounded-[16px] rounded-br-[4px]' : 'bg-white border border-gray-50 rounded-[16px] rounded-bl-[4px] shadow-sm'}`}>
                      {msg.html ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#F4A261]/10 text-[#F4A261] flex items-center justify-center mr-2 md:mr-3 shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-[15px] md:h-[15px]">
                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                        <path d="M12 12v9" />
                        <path d="m8 17 4 4 4-4" />
                      </svg>
                    </div>
                    <div className="bg-white px-4 md:px-5 py-3 md:py-4 border border-gray-50 rounded-[16px] rounded-bl-[4px] shadow-sm flex items-center gap-1.5 h-[40px] md:h-[46px]">
                      <span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Area Input Chat */}
              <div className="absolute bottom-0 left-0 w-full p-3 md:p-6 pt-0 bg-gradient-to-t from-[#FDFDF9] via-white to-transparent">
                <form onSubmit={handleSendMessage} className="relative flex items-end bg-white/90 backdrop-blur-md rounded-[20px] shadow-[0_5px_25px_rgba(0,0,0,0.06)] border border-gray-200 p-1.5 md:p-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Tanyakan sesuatu..."
                    rows={1}
                    className="flex-1 max-h-[100px] md:max-h-[120px] bg-transparent border-0 focus:ring-0 resize-none outline-none text-[#2D3748] px-3 md:px-4 py-2 md:py-3 text-sm md:text-base custom-scrollbar"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className={`p-2.5 md:p-3.5 mb-1 mr-1 rounded-xl transition-all ${inputValue.trim() && !isTyping ? 'bg-[#F4A261] text-white shadow-md' : 'bg-gray-100 text-[#A0AEC0]'}`}
                  >
                    <Send size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </form>
              </div>
            </Card>

          </div>
        </div>
      )}
    </>
  );
}
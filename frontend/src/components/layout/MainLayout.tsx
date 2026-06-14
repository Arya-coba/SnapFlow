import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen font-sans flex overflow-x-hidden relative bg-[#FDFBF7]">
      <Sidebar />
      
      {/* Container Utama */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto relative min-h-screen flex flex-col
        /* 📱 Mobile Layout: Full width, tidak ada margin kiri, tambah padding bawah agar konten tidak tertutup Bottom Bar */
        ml-0 px-4 pb-24 
        /* 💻 Desktop Layout: Margin kiri untuk Sidebar, padding bawah normal */
        md:ml-[110px] sm:px-6 lg:px-8 md:pb-6"
      >
        <Topbar />
        
        {/* Render Konten */}
        <main className="flex-1 flex flex-col relative w-full mt-4 md:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet } from 'react-router-dom'; // Tempat konten merender

export default function MainLayout() {
  return (
    <div className="min-h-screen font-sans flex overflow-x-hidden relative">
      <Sidebar />
      <div className="flex-1 ml-[110px] max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative min-h-screen flex flex-col pb-6">
        <Topbar />
        {/* Render Konten */}
        <main className="flex-1 flex flex-col relative w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
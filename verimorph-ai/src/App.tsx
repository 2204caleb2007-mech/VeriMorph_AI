import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import History from './pages/History';
import Report from './pages/Report';
import Chat from './pages/Chat';
import { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import MiniPdfPlayer from './components/upload/MiniPdfPlayer';

function App() {
  const theme = useAppStore(s => s.theme);
  const { isMiniPlayerOpen, pdfUrl, closeMiniPlayer } = useAppStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const isReport = window.location.pathname.startsWith('/report');

  return (
    <BrowserRouter>
      {!isReport && <Header />}

      {/* Offline banner */}
      <OfflineBanner />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analysis/:id" element={<Analysis />} />
        <Route path="/history" element={<History />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Mini PDF Player — shown across all pages */}
      {isMiniPlayerOpen && pdfUrl && (
        <MiniPdfPlayer pdfUrl={pdfUrl} onClose={closeMiniPlayer} />
      )}
    </BrowserRouter>
  );
}

function OfflineBanner() {
  const offlineMode = useAppStore(s => s.offlineMode);
  if (!offlineMode) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-orange-500 text-white text-center text-sm font-semibold py-1.5 px-4"
    >
      ⚠ Offline Mode — All processing runs locally in your browser
    </div>
  );
}

export default App;


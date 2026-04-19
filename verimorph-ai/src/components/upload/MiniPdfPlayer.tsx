// ============================================================
// PART 11 — Mini PDF Player Component
// Fixed bottom-right, draggable, iframe, no external library
// URL.revokeObjectURL on unmount
// ============================================================
import { useState, useEffect, useRef } from 'react';

interface MiniPdfPlayerProps {
  pdfUrl: string;
  onClose: () => void;
}

const MiniPdfPlayer: React.FC<MiniPdfPlayerProps> = ({ pdfUrl, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Revoke object URL on unmount — no memory leaks
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const width = Math.min(350, window.innerWidth * 0.9);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${24 - position.y}px`,
        right: `${24 - position.x}px`,
        width: `${width}px`,
        height: isMinimized ? '52px' : '460px',
        zIndex: 9999,
        transition: 'height 0.3s ease',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}
      className="bg-[#0A0A0A] border border-white/10"
    >
      {/* Header — draggable */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3 py-2 bg-[#111111] border-b border-white/5 cursor-move select-none"
        style={{ height: '52px' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
            PDF Preview
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Fullscreen */}
          <button
            onClick={() => window.open(pdfUrl, '_blank')}
            title="Open fullscreen"
            className="p-1.5 rounded-md text-app-accent hover:brightness-110 hover:bg-app-accent/10 transition-all text-sm font-bold"
            aria-label="Open PDF fullscreen"
          >
            ⛶
          </button>
          {/* Minimize */}
          <button
            onClick={() => setIsMinimized((v) => !v)}
            title={isMinimized ? 'Expand' : 'Minimize'}
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-all text-lg leading-none"
            aria-label={isMinimized ? 'Expand PDF player' : 'Minimize PDF player'}
          >
            {isMinimized ? '▲' : '–'}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-md text-white/50 hover:text-red-500 hover:bg-red-500/10 transition-all text-lg leading-none"
            aria-label="Close PDF player"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iframe body */}
      {!isMinimized && (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          style={{ width: '100%', height: 'calc(100% - 52px)', border: 'none' }}
        />
      )}
    </div>
  );
};

export default MiniPdfPlayer;

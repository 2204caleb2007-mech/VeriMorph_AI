import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type {} from '../../shared/types';

interface Props {
  canvas: HTMLCanvasElement | null;
  overlayZones: ValidationResult['suspiciousZones'];
  highlightedZoneIndex: number | null;
  ocrWords: ValidationResult['ocrWords'];
  onZoneClick: (index: number) => void;
}

export default function DocumentViewer({ canvas, overlayZones, highlightedZoneIndex, ocrWords, onZoneClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Attach canvas to container
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    const container = containerRef.current;
    canvas.style.maxWidth = '100%';
    canvas.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(canvas);
  }, [canvas]);

  // Draw overlay
  useEffect(() => {
    if (!overlayRef.current || !canvas) return;
    const oc = overlayRef.current;
    oc.width = canvas.width;
    oc.height = canvas.height;
    const ctx = oc.getContext('2d')!;
    ctx.clearRect(0, 0, oc.width, oc.height);

    overlayZones.forEach((zone, i) => {
      if (!zone.bbox) return;
      const isHighlighted = i === highlightedZoneIndex;
      ctx.fillStyle = isHighlighted ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.18)';
      ctx.strokeStyle = isHighlighted ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.7)';
      ctx.lineWidth = isHighlighted ? 3 : 1.5;
      ctx.fillRect(zone.bbox.x, zone.bbox.y, zone.bbox.width, zone.bbox.height);
      ctx.strokeRect(zone.bbox.x, zone.bbox.y, zone.bbox.width, zone.bbox.height);

      if (isHighlighted) {
        ctx.shadowColor = 'rgba(239,68,68,0.8)';
        ctx.shadowBlur = 12;
        ctx.strokeRect(zone.bbox.x, zone.bbox.y, zone.bbox.width, zone.bbox.height);
        ctx.shadowBlur = 0;
      }
    });
  }, [overlayZones, highlightedZoneIndex, canvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!overlayRef.current || !canvas) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < overlayZones.length; i++) {
      const z = overlayZones[i];
      if (z.bbox && cx >= z.bbox.x && cx <= z.bbox.x + z.bbox.width &&
          cy >= z.bbox.y && cy <= z.bbox.y + z.bbox.height) {
        onZoneClick(i);
        return;
      }
    }
    onZoneClick(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-full bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/5 flex flex-col shadow-inner"
    >
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/10">
        <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400 px-1 min-w-[40px] text-center font-mono">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas area */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <div
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', transition: dragging ? 'none' : 'transform 0.2s ease' }}
          className="relative"
        >
          <div ref={containerRef} className="relative" />
          <canvas
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="absolute inset-0 pointer-events-auto"
            style={{ maxWidth: '100%', cursor: 'crosshair' }}
          />
        </div>
      </div>

      {!canvas && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
            <span className="text-3xl grayscale opacity-50">📄</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest opacity-50">No Document Preview</span>
        </div>
      )}
    </motion.div>
  );
}

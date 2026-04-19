import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, XCircle, RefreshCw, History, ArrowLeft } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import DocumentViewer from '../components/analysis/DocumentViewer';
import ExplainabilityPanel from '../components/analysis/ExplainabilityPanel';
import { canvasStore } from './Upload';
import { runFullPipeline } from '../services/pipeline';


export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    validationResults, highlightedZoneIndex, highlightedExplanationIndex,
    setHighlightedZone, setHighlightedExplanation, markAsFake,
    setValidating, prependResult, setActiveResult, selectedLanguage,
  } = useAppStore();

  const result = validationResults.find(r => r.id === id);

  if (!result) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <div className="text-5xl">🔍</div>
        <h2 className="text-2xl font-bold">Result not found</h2>
        <p className="text-slate-400">This analysis result may have been cleared.</p>
        <button onClick={() => navigate('/upload')}
          className="px-6 py-2.5 rounded-xl bg-app-accent text-black hover:brightness-110 transition-colors font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          Upload a document
        </button>
      </div>
    );
  }

  // Get index within validationResults to look up canvas
  const resultIndex = validationResults.indexOf(result);
  const canvas = canvasStore.get(resultIndex) ?? null;

  const handleRetry = async () => {
    if (!canvas) return;
    setValidating(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], result.fileName, { type: 'image/png' });
        const newResult = await runFullPipeline(file, selectedLanguage, resultIndex, canvasStore);
        prependResult(newResult);
        setActiveResult(newResult.id);
        navigate(`/analysis/${newResult.id}`);
        setValidating(false);
      });
    } catch {
      setValidating(false);
    }
  };


  return (
    <div className="h-[calc(100vh-64px)] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111111]/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-semibold text-sm truncate max-w-xs">{result.fileName}</h1>
            <p className="text-slate-500 text-xs">{result.metadata.institution} · {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/report/${result.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-accent text-black text-sm font-bold transition-all hover:brightness-110 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
            <Download className="w-4 h-4" /> Report
          </button>
          <button onClick={() => markAsFake(result.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium transition-all hover:bg-red-500/20">
            <XCircle className="w-4 h-4" /> Mark Fake
          </button>
          <button onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button onClick={() => navigate('/history')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all">
            <History className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 grid lg:grid-cols-2 gap-0 overflow-hidden min-h-0">
        {/* LEFT — Document viewer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-r border-white/5 p-4 overflow-hidden flex flex-col min-h-0"
        >
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 flex-shrink-0">
            Document Preview
          </h2>
          <div className="flex-1 min-h-0">
            <DocumentViewer
              canvas={canvas}
              overlayZones={result.suspiciousZones}
              highlightedZoneIndex={highlightedZoneIndex}
              ocrWords={result.ocrWords}
              onZoneClick={(i) => {
                if (i === -1) { setHighlightedZone(null); setHighlightedExplanation(null); return; }
                setHighlightedZone(i);
                const expIdx = result.explanations.findIndex(e => e.linkedZoneIndex === i);
                if (expIdx !== -1) setHighlightedExplanation(expIdx);
              }}
            />
          </div>
        </motion.div>

        {/* RIGHT — Explainability panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 flex flex-col overflow-hidden min-h-0"
        >
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 flex-shrink-0">
            AI Analysis
          </h2>
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            <ExplainabilityPanel
              result={result}
              highlightedExplanationIndex={highlightedExplanationIndex}
              onExplanationClick={(i) => setHighlightedExplanation(i)}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

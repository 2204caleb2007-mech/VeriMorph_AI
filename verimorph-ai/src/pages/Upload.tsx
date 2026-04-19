// ============================================================
// Upload Page — PART 11 (PART 8 Step)
// Integrates UploadBox (with MiniPdfPlayer + SuggestedQuestions)
// Language selector: all 9 languages
// Concurrency selector: 1-4
// ============================================================
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import UploadBox from '../components/upload/UploadBox';
import { runFullPipeline, limitedParallel } from '../services/pipeline';

// Global canvas store persisted outside React to survive re-renders
export const canvasStore = new Map<number, HTMLCanvasElement>();

// PART 19 — All 9 languages exactly as specified
const LANGUAGES = [
  { label: 'Auto-detect', value: 'auto' },
  { label: 'English', value: 'eng' },
  { label: 'Tamil', value: 'tam' },
  { label: 'Hindi', value: 'hin' },
  { label: 'Bengali', value: 'ben' },
  { label: 'Marathi', value: 'mar' },
  { label: 'Gujarati', value: 'guj' },
  { label: 'Urdu', value: 'urd' },
  { label: 'Kannada', value: 'kan' },
  { label: 'Malayalam', value: 'mal' },
];

export default function Upload() {
  const navigate = useNavigate();
  const {
    isValidating, offlineMode, concurrency, selectedLanguage,
    setValidating, prependResult, setActiveResult,
    setConcurrency, setLanguage,
  } = useAppStore();

  const filesRef = useRef<File[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    filesRef.current = files;
    setValidating(true);
    try {
      const results = await limitedParallel(
        files,
        concurrency,
        (file, i) => runFullPipeline(file, selectedLanguage, i, canvasStore)
      );
      if (results.length > 0) {
        for (let i = results.length - 1; i >= 0; i--) {
          prependResult(results[i]);
        }
        setActiveResult(results[0].id);
        navigate(`/analysis/${results[0].id}`);
      } else {
        alert("Pipeline completed but no results were returned.");
      }
    } catch (err: any) {
      console.error('Pipeline error:', err);
      alert(`Pipeline error: ${err.message || String(err)}\nEnsure your browser supports web workers and pdf.js is loaded.`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-8 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Upload Documents
          </h1>
          <p className="text-slate-400">
            Upload certificates, IDs or official documents for AI-powered forensic analysis.
          </p>
        </motion.div>

        {/* Controls Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          {/* Language selector — all 9 languages (PART 19) */}
          <div className="flex-1">
            <label
              htmlFor="language-selector"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1"
            >
              OCR Language
            </label>
            <select
              id="language-selector"
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="
                w-full px-3 py-2.5 rounded-xl text-sm
                bg-[#111111]
                border border-white/10
                text-slate-200
                focus:outline-none focus:ring-2 focus:ring-app-accent
              "
              aria-label="Select OCR language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Concurrency selector: 1-4, default 3 */}
          <div className="sm:w-40">
            <label
              htmlFor="concurrency-selector"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1"
            >
              Workers (1–4)
            </label>
            <select
              id="concurrency-selector"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="
                w-full px-3 py-2.5 rounded-xl text-sm
                bg-[#111111]
                border border-white/10
                text-slate-200
                focus:outline-none focus:ring-2 focus:ring-app-accent
              "
              aria-label="Select number of concurrent workers"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} worker{n !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Upload Box Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card border border-white/5 rounded-2xl p-8 shadow-soft"
        >
          {offlineMode && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium flex items-center gap-2">
              <span>📵</span> Offline mode active — processing happens entirely in your browser
            </div>
          )}
          <UploadBox
            onFilesSelected={handleFilesSelected}
            isProcessing={isValidating}
          />
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {[
            { emoji: '🔒', title: 'Local Processing', desc: 'Files never leave your browser — zero server upload' },
            { emoji: '⚡', title: 'Real-time OCR', desc: 'Tesseract.js extracts text in all 9 supported languages' },
            { emoji: '📊', title: 'Full Report', desc: 'Download 7-page PDF forensic report or Excel export' },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="p-4 rounded-xl bg-app-surface border border-white/5 text-center"
            >
              <div className="text-2xl mb-2">{emoji}</div>
              <div className="text-white font-semibold text-sm mb-1">{title}</div>
              <div className="text-slate-400 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

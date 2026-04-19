import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image, File, AlertCircle, Loader2, Scan, ChevronDown } from 'lucide-react';

interface FilePreview {
  file: File;
  preview?: string;
}

interface Props {
  onFileUpload: (files: File[]) => void;
  isValidating: boolean;
  offlineMode: boolean;
  concurrency: number;
  onConcurrencyChange: (n: number) => void;
  selectedLanguage: string;
  onLanguageChange: (l: string) => void;
}

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'eng', label: 'English' },
  { value: 'tam', label: 'Tamil' },
  { value: 'hin', label: 'Hindi' },
  { value: 'tel', label: 'Telugu' },
  { value: 'ben', label: 'Bengali' },
];

function fileIcon(file: File) {
  if (file.type === 'application/pdf') return <FileText className="w-8 h-8 text-white/70" />;
  if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-white/70" />;
  return <File className="w-8 h-8 text-white/40" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({
  onFileUpload, isValidating, offlineMode,
  concurrency, onConcurrencyChange, selectedLanguage, onLanguageChange
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f =>
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    );
    setPreviews(prev => {
      const combined = [...prev];
      for (const f of valid) {
        if (!combined.find(p => p.file.name === f.name)) {
          const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
          combined.push({ file: f, preview });
        }
      }
      return combined;
    });
  }, []);

  const removeFile = (name: string) => {
    setPreviews(prev => prev.filter(p => p.file.name !== name));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleValidate = () => {
    if (previews.length > 0) onFileUpload(previews.map(p => p.file));
  };

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      <AnimatePresence>
        {offlineMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Offline Mode active — processing runs locally, no API calls will be made.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      <motion.div
        animate={dragging ? { scale: 1.02 } : { scale: 1 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${dragging
            ? 'border-app-accent bg-app-accent-subtle scale-[1.02]'
            : 'border-white/10 bg-[#0A0A0A] hover:border-white/20 hover:bg-[#111111]'}`}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className={`p-4 rounded-2xl transition-colors ${dragging ? 'bg-app-accent/20' : 'bg-[#111111]'}`}>
          <Upload className={`w-10 h-10 transition-colors ${dragging ? 'text-app-accent' : 'text-white/40'}`} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">
            {dragging ? 'Drop files here' : 'Drag & drop documents'}
          </p>
          <p className="text-slate-400 text-sm mt-1">or click to browse</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {[['PDF', 'bg-white/5 text-white/60'], ['JPG/PNG', 'bg-white/5 text-white/60'], ['Photos', 'bg-app-accent-subtle text-app-accent']].map(([label, cls]) => (
            <span key={label} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>{label}</span>
          ))}
        </div>
      </motion.div>

      {/* File Previews */}
      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {previews.map(({ file, preview }) => (
              <motion.div
                key={file.name}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative p-3 rounded-xl bg-[#111111] border border-white/5 group transition-all hover:border-white/10"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col items-center gap-2">
                  {preview
                    ? <img src={preview} alt={file.name} className="w-16 h-16 object-cover rounded-lg" />
                    : <div className="w-16 h-16 flex items-center justify-center">{fileIcon(file)}</div>
                  }
                  <span className="text-xs text-slate-300 truncate w-full text-center">{file.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">{formatSize(file.size)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Row */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Language */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm text-slate-400 font-medium mb-1.5">Language</label>
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-[#111111] border border-white/5 text-white text-sm focus:outline-none focus:border-app-accent cursor-pointer transition-colors"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Workers */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm text-slate-400 font-medium mb-1.5">Workers: {concurrency}</label>
          <select
            value={concurrency}
            onChange={(e) => onConcurrencyChange(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-[#111111] border border-white/5 text-white text-sm focus:outline-none focus:border-app-accent cursor-pointer transition-colors"
          >
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Worker{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        {/* Validate Button */}
        <button
          onClick={handleValidate}
          disabled={isValidating || previews.length === 0}
          className={`flex-shrink-0 flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white transition-all
            ${isValidating || previews.length === 0
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-app-accent text-black hover:brightness-110 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02]'}`}
        >
          {isValidating ? (
            <>
              <Scan className="w-5 h-5 animate-pulse" />
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Scan className="w-5 h-5" />
              Validate Documents
            </>
          )}
        </button>
      </div>

      {/* Progress bar (while validating) */}
      <AnimatePresence>
        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-xs text-slate-400">
              <span>Running AI analysis pipeline…</span>
              <span>OCR → Hash → QR → Score</span>
            </div>
            <div className="h-1 bg-[#111111] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-app-accent shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                animate={{ width: ['20%', '80%', '60%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

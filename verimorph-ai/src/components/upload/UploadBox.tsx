// ============================================================
// PART 11 — UploadBox.tsx
// Drag-and-drop, PDF mini player trigger, Groq suggested questions
// Memory-safe: URL.revokeObjectURL via store/MiniPdfPlayer
// ============================================================
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import SuggestedQuestions from '../chat/SuggestedQuestions';
import api from '../../services/api';

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

const UploadBox: React.FC<UploadBoxProps> = ({ onFilesSelected, isProcessing = false }) => {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setPdfUrl, setPdfExtractedText, setSuggestedQuestions, suggestedQuestions, isChatLoading } = useAppStore();

  const ACCEPTED = '.pdf,.jpg,.jpeg,.png';

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) =>
      /\.(pdf|jpg|jpeg|png)$/i.test(f.name)
    );
    if (!arr.length) return;

    setSelectedFiles(arr);

    // Handle PDF: open mini player + extract text + Groq questions
    const pdfFile = arr.find((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfFile) {
      const objectUrl = URL.createObjectURL(pdfFile);
      setPdfUrl(objectUrl);
      setPdfLoading(true);

      try {
        // Extract PDF text via pdfjs-dist
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setPdfExtractedText(fullText);

        // Send to backend for Groq question generation
        try {
          const response = await api.readPdfAndGetQuestions(pdfFile);
          setSuggestedQuestions(response.suggested_questions || []);
        } catch {
          // Fallback: generate basic questions from text
          const questions = generateFallbackQuestions(fullText);
          setSuggestedQuestions(questions);
        }
      } catch {
        setSuggestedQuestions([]);
      } finally {
        setPdfLoading(false);
      }
    }
  }, [setPdfUrl, setPdfExtractedText, setSuggestedQuestions]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleQuestionClick = async (question: string) => {
    const { appendChatMessage, setSearching, isMiniPlayerOpen } = useAppStore.getState();
    if (!isMiniPlayerOpen) return;

    appendChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    });

    setSearching(true);
    try {
      const result = await api.tavilySearch(question);
      appendChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer || result.context_block || 'No results found.',
        timestamp: new Date().toISOString(),
        source: 'tavily',
        sources: (result.sources || []).map((s: any) => ({ url: s.url, title: s.title || s.url })),
      });
    } finally {
      setSearching(false);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          borderColor: dragging ? 'var(--color-primary)' : 'var(--color-border)',
          scale: dragging ? 1.01 : 1,
        }}
        className="
          relative cursor-pointer rounded-2xl border-2 border-dashed
          border-white/10
          bg-black
          hover:border-app-accent/40
          hover:bg-white/[0.02]
          transition-all duration-300
          p-10 text-center
        "
        aria-label="Upload document"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          aria-label="File input"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black border border-white/5 flex items-center justify-center">
            {isProcessing || pdfLoading ? (
              <Loader2 className="w-8 h-8 text-app-accent animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-app-accent" />
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white">
              {dragging ? 'Drop files here' : 'Drop documents or click to upload'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              PDF, JPG, PNG — max 20MB each, up to 20 files
            </p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {selectedFiles.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/5"
              >
                <FileText className="w-5 h-5 text-app-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {/* Analyze button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onFilesSelected(selectedFiles)}
              disabled={isProcessing}
              id="analyze-button"
              className="
                w-full py-3.5 rounded-xl font-bold text-black
                bg-app-accent
                hover:brightness-110
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)]
                focus:outline-none focus:ring-2 focus:ring-app-accent
                flex items-center justify-center gap-2
              "
              aria-label="Start forensic analysis"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>🔬 Run Forensic Analysis</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Questions from Groq */}
      <SuggestedQuestions
        questions={suggestedQuestions}
        onQuestionClick={handleQuestionClick}
        isLoading={pdfLoading || isChatLoading}
      />
    </div>
  );
};

// Fallback: generate basic questions from OCR text when backend unavailable
function generateFallbackQuestions(text: string): string[] {
  const words = text.split(/\s+/).slice(0, 200).join(' ');
  if (!words.trim()) return [];

  return [
    'What institution issued this document?',
    'Is the issuing authority legitimate and accredited?',
    'Are the dates on this document consistent and valid?',
    'What certifications or qualifications does this document represent?',
    'Are there any known forgery indicators for this document type?',
    'What verification methods can confirm this document\'s authenticity?',
  ];
}

export default UploadBox;

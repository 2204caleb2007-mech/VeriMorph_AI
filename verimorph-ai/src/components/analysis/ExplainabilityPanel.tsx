import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, BarChart2, Brain, FileText, Link2, Hash } from 'lucide-react';
import type {} from '../../shared/types';
import IssueCard from './IssueCard';
import ConfidenceScore from './ConfidenceScore';
import OCRTextViewer from './OCRTextViewer';
import useAppStore from '../../store/useAppStore';

interface Props {
  result: ValidationResult;
  highlightedExplanationIndex: number | null;
  onExplanationClick: (i: number) => void;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111111] border-b border-white/5 hover:bg-white/5 transition-all text-left"
      >
        <div className="flex items-center gap-2.5 font-semibold text-white">
          <Icon className="w-4 h-4 text-app-accent" />
          {title}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-black/40">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExplainabilityPanel({ result, highlightedExplanationIndex, onExplanationClick }: Props) {
  const { setHighlightedZone } = useAppStore();

  const narrative = result.explanations.length > 0
    ? result.explanations.map(e => e.description).join(' ')
    : 'No anomalies detected. The document appears to match expected structural patterns for this document type.';

  return (
    <div className="flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1 h-full">

      {/* Section 1 — Detected Issues */}
      <Section title={`🔴 Detected Issues (${result.explanations.length})`} icon={AlertTriangle}>
        {result.explanations.length === 0 ? (
          <p className="text-emerald-400 text-sm">✓ No issues detected — document appears authentic.</p>
        ) : (
          result.explanations.map((exp, i) => (
            <IssueCard
              key={i}
              explanation={exp}
              isActive={highlightedExplanationIndex === i}
              onClick={() => {
                onExplanationClick(i);
                if (exp.linkedZoneIndex !== undefined) setHighlightedZone(exp.linkedZoneIndex);
              }}
            />
          ))
        )}
      </Section>

      {/* Section 2 — Confidence Score */}
      <Section title="📊 Confidence Score" icon={BarChart2}>
        <ConfidenceScore
          score={result.forgeryScore}
          status={result.status}
          shapeAnalysis={result.shapeAnalysis}
        />
      </Section>

      {/* Section 3 — AI Explanation */}
      <Section title="🧠 AI Explanation" icon={Brain}>
        <p className="text-slate-400 text-sm leading-relaxed">{narrative}</p>

        <div className="mt-3 p-3 rounded-xl bg-black border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">
            <Hash className="w-3.5 h-3.5" /> Morphological Hash
          </div>
          <code className="font-mono text-xs text-app-accent break-all">{result.morphHash}</code>
        </div>

        {result.qrData ? (
          <div className="mt-2 p-3 rounded-xl bg-black border border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-mono uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5" /> QR Code Content
            </div>
            {result.qrData.startsWith('http') ? (
              <a href={result.qrData} target="_blank" rel="noopener noreferrer"
                className="text-app-accent hover:brightness-110 text-xs break-all underline">
                🔗 {result.qrData}
              </a>
            ) : (
              <span className="text-slate-300 text-xs">📄 {result.qrData}</span>
            )}
          </div>
        ) : (
          <div className="mt-2 p-3 rounded-xl bg-black border border-white/10">
            <span className="text-slate-500 text-xs">❌ No QR code found in document</span>
          </div>
        )}
      </Section>

      {/* Section 4 — OCR Text */}
      <Section title="📝 OCR Extracted Text" icon={FileText} defaultOpen={false}>
        <OCRTextViewer ocrText={result.ocrText} ocrWords={result.ocrWords} />
      </Section>
    </div>
  );
}

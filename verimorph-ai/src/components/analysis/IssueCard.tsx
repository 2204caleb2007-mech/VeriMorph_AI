import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type {} from '../../shared/types';

interface Props {
  explanation: ValidationResult['explanations'][0];
  isActive: boolean;
  onClick: () => void;
}

const typeLabels: Record<string, string> = {
  font_mismatch: 'Font Mismatch',
  layout_anomaly: 'Layout Anomaly',
  image_tampering: 'Image Tampering',
  text_inconsistency: 'Text Inconsistency',
  suspicious_keyword: 'Suspicious Keyword',
  seal_missing: 'Seal Missing',
};

const severityConfig = {
  high: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: 'text-red-500', label: 'HIGH' },
  medium: { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: 'text-yellow-500', label: 'MEDIUM' },
  low: { cls: 'bg-white/5 text-slate-500 border-white/10', icon: 'text-slate-500', label: 'LOW' },
};

export default function IssueCard({ explanation, isActive, onClick }: Props) {
  const sev = severityConfig[explanation.severity];
  return (
    <motion.div
      layout
      onClick={onClick}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      className={`p-4 rounded-xl border cursor-pointer transition-all
        ${isActive
          ? 'bg-app-accent-subtle border-app-accent/50 ring-2 ring-app-accent/30'
          : 'bg-black border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sev.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-white">{typeLabels[explanation.type]}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${sev.cls}`}>
              {sev.label}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{explanation.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// PART 13 — Forensic Analysis Panel
// Displays text forensics: authenticity_score, tampering_risk,
// ai_generated_likelihood, verdict, key_reasons, flagged_passages
// ============================================================
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle, Brain, Flag } from 'lucide-react';
import type { ValidationResult } from '../../shared/types';

interface ForensicAnalysisPanelProps {
  forensicAnalysis: ValidationResult['forensicAnalysis'];
}

const verdictColor = {
  'Likely Authentic': 'text-app-accent',
  'Suspicious - Requires Review': 'text-amber-500',
  'Likely Forged': 'text-red-500',
};

const riskColor = {
  low: 'bg-app-accent-subtle text-app-accent border border-app-accent/20',
  medium: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  high: 'bg-red-500/10 text-red-500 border border-red-500/20',
};

const ForensicAnalysisPanel: React.FC<ForensicAnalysisPanelProps> = ({ forensicAnalysis }) => {
  if (!forensicAnalysis) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4 text-sm text-slate-500">
        No forensic text analysis available. Upload a document to analyze.
      </div>
    );
  }

  const {
    authenticity_score,
    tampering_risk,
    ai_generated_likelihood,
    verdict,
    key_reasons,
    flagged_passages,
  } = forensicAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/5 bg-[#0A0A0A] overflow-hidden shadow-soft"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-[#111111]/50">
        {authenticity_score >= 70 ? (
          <ShieldCheck className="w-5 h-5 text-app-accent" />
        ) : authenticity_score >= 40 ? (
          <AlertTriangle className="w-5 h-5 text-amber-500" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-red-500" />
        )}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Text Forensic Analysis
          </h3>
          <p className={`text-xs font-bold mt-0.5 ${verdictColor[verdict]}`}>{verdict}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-black text-slate-800 dark:text-white">{authenticity_score}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Authenticity Score</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Risk Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${riskColor[tampering_risk]}`}>
            Tampering: {tampering_risk.toUpperCase()}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${riskColor[ai_generated_likelihood]} flex items-center gap-1`}>
            <Brain className="w-3 h-3" />
            AI Gen: {ai_generated_likelihood.toUpperCase()}
          </span>
        </div>

        {/* Score Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            <span>Authenticity Index</span>
            <span>{authenticity_score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black border border-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${authenticity_score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                authenticity_score >= 70
                  ? 'bg-app-accent shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                  : authenticity_score >= 40
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Key Reasons */}
        {key_reasons.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Key Findings
            </h4>
            <ul className="space-y-1.5">
              {key_reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Flagged Passages */}
        {flagged_passages.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> Flagged Passages
            </h4>
            <div className="space-y-2">
              {flagged_passages.map((passage, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-mono"
                >
                  "{passage}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ForensicAnalysisPanel;

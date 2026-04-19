// ============================================================
// PART 13 — Compliance Panel
// Displays compliance validation: score, violations, missing reqs
// ============================================================
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ValidationResult } from '../../shared/types';

interface CompliancePanelProps {
  complianceResult: ValidationResult['complianceResult'];
}

const CompliancePanel: React.FC<CompliancePanelProps> = ({ complianceResult }) => {
  if (!complianceResult) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4 text-sm text-slate-500">
        No compliance data available.
      </div>
    );
  }

  const { overall_compliance_score, aligned_percentage, violations, missing_requirements } = complianceResult;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/5 bg-[#0A0A0A] overflow-hidden shadow-soft"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-[#111111]/50">
        {overall_compliance_score >= 70 ? (
          <CheckCircle2 className="w-5 h-5 text-app-accent" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Compliance Validation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {aligned_percentage.toFixed(1)}% of statements aligned
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-2xl font-black ${overall_compliance_score >= 70 ? 'text-app-accent' : 'text-red-500'}`}>
            {overall_compliance_score}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Compliance</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Score Bar */}
        <div>
          <div className="h-1.5 rounded-full bg-black border border-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overall_compliance_score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${overall_compliance_score >= 70 ? 'bg-app-accent' : 'bg-red-500'}`}
            />
          </div>
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Violations ({violations.length})
            </h4>
            <div className="space-y-2">
              {violations.map((v, i) => (
                <div key={i} className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-xs">
                  <p className="font-semibold text-red-700 dark:text-red-300 mb-1">{v.violating_statement}</p>
                  <p className="text-slate-500 dark:text-slate-400">↳ Rule: {v.reference_rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Requirements */}
        {missing_requirements.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Missing Requirements
            </h4>
            <ul className="space-y-1.5">
              {missing_requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CompliancePanel;

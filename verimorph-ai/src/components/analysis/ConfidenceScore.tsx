import { motion } from 'framer-motion';
import type {} from '../../shared/types';
import StatusBadge from '../common/StatusBadge';

interface Props { score: number; status: ValidationResult['status']; shapeAnalysis: ValidationResult['shapeAnalysis'] }

const barColor = (s: number) =>
  s >= 85 ? 'from-app-accent to-app-accent-hover' : s >= 50 ? 'from-yellow-500 to-amber-400' : 'from-red-500 to-rose-400';

export default function ConfidenceScore({ score, status, shapeAnalysis }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-slate-400 text-sm ml-1">/100</span>
          <div className="text-xs text-slate-500 mt-0.5">Forgery Score</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Animated bar */}
      <div className="h-2 bg-black border border-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${barColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {[
          { label: 'Layout Score', value: `${shapeAnalysis.layoutScore}%` },
          { label: 'Seal Position', value: shapeAnalysis.sealPosition },
          { label: 'Text Alignment', value: shapeAnalysis.textAlignment },
          { label: 'Logo Integrity', value: shapeAnalysis.logoIntegrity },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-xl bg-black border border-white/10 transition-colors hover:border-white/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</div>
            <div className="text-sm font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

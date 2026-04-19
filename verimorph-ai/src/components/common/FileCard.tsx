import { CheckCircle, AlertTriangle, XCircle, Eye, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ValidationResult } from '../../shared/types';
import StatusBadge from './StatusBadge';

interface Props {
  result: ValidationResult;
  onView: () => void;
  onDownload: () => void;
}

const statusIcon = {
  authentic: <CheckCircle className="w-6 h-6 text-app-accent" />,
  suspicious: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  fake: <XCircle className="w-6 h-6 text-red-500" />,
};

const scoreColor = (s: number) =>
  s >= 85 ? 'bg-app-accent shadow-[0_0_8px_rgba(34,197,94,0.4)]' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

export default function FileCard({ result, onView, onDownload }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-app-card border border-white/5 hover:border-white/10 hover:shadow-soft transition-all"
    >
      <div className="flex-shrink-0">{statusIcon[result.status]}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs">
            {result.fileName}
          </span>
          <StatusBadge status={result.status} />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {result.metadata.institution} · {new Date(result.timestamp).toLocaleString()}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-black rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${scoreColor(result.forgeryScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${result.forgeryScore}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-300 w-8 text-right">
            {result.forgeryScore}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onView}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-all"
        >
          <Eye className="w-4 h-4" /> View
        </button>
        <button
          onClick={onDownload}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-all outline-none"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

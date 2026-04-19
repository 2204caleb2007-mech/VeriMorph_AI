// ============================================================
// ErrorCard — PART 7a common
// ============================================================
import { AlertTriangle } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ title = 'Error', message, onRetry }) => (
  <div
    role="alert"
    className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3"
  >
    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-red-700 dark:text-red-400">{title}</p>
      <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label="Retry action"
        >
          Try again →
        </button>
      )}
    </div>
  </div>
);

export default ErrorCard;

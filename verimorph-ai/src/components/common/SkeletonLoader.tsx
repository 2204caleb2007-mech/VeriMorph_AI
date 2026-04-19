// ============================================================
// SkeletonLoader — PART 7e common
// ============================================================
interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 animate-pulse ${className}`} aria-busy="true" aria-label="Loading">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 rounded-full bg-slate-200 dark:bg-slate-700"
        style={{ width: `${85 - i * 10}%` }}
      />
    ))}
  </div>
);

export default SkeletonLoader;

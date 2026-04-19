import type {} from '../../shared/types';

interface Props { status: ValidationResult['status'] }

const config = {
  authentic: { label: 'AUTHENTIC', cls: 'bg-app-accent-subtle text-app-accent border-app-accent/20' },
  suspicious: { label: 'SUSPICIOUS', cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  fake: { label: 'FAKE', cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function StatusBadge({ status }: Props) {
  const { label, cls } = config[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest border ${cls}`}>
      {label}
    </span>
  );
}

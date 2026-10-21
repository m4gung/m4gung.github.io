import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-2 px-3 py-6' : 'gap-3 px-6 py-16'}`}>
      <span
        className={`flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 ${
          compact ? 'size-10' : 'size-14'
        }`}
      >
        <Icon className={compact ? 'size-5' : 'size-7'} aria-hidden="true" />
      </span>
      <h2 className={`font-semibold text-slate-900 dark:text-slate-100 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h2>
      <div className={`max-w-md text-slate-500 dark:text-slate-400 ${compact ? 'text-xs' : 'text-sm'}`}>
        {description}
      </div>
      {action}
    </div>
  );
}

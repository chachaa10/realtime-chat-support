import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      {icon ? (
        <div className="text-ink-dim mb-3">{icon}</div>
      ) : (
        <div className="bg-surface-sunken text-ink-dim mb-3 flex size-12 items-center justify-center rounded-full">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
      )}
      <h3 className="text-ink text-[0.9375rem] font-medium">{title}</h3>
      {description && (
        <p className="text-ink-muted mt-1 max-w-xs text-[0.8125rem]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

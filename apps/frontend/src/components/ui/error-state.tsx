import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message: string;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center p-8', className)}>
      <div className="mx-auto max-w-sm text-center">
        <div className="bg-danger/10 text-danger mx-auto mb-3 flex size-10 items-center justify-center rounded-full">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-danger text-[0.9375rem] font-medium">{message}</p>
        {error && (
          <p className="text-ink-muted mt-1 text-[0.8125rem]">
            {error.message || 'An unexpected error occurred'}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="border-border text-ink hover:bg-surface-sunken mt-4 inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const spinner = (
    <svg
      className={cn('animate-spin text-ink-dim', sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
        className="opacity-20"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="8"
        strokeLinecap="round"
      />
    </svg>
  );

  if (label) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        <span className="text-ink-muted text-[0.8125rem]">{label}</span>
      </span>
    );
  }

  return spinner;
}

export function SpinnerFullPage({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <Spinner size="lg" />
      {label && <span className="text-ink-muted text-[0.8125rem]">{label}</span>}
    </div>
  );
}

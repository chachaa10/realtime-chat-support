import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-ink-muted/10 animate-skeleton rounded-lg',
        className,
      )}
    />
  )
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 && lines > 1 ? 'w-[60%]' : 'w-full',
          )}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton className={cn('size-9 shrink-0 rounded-full', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('border-border space-y-3 rounded-lg border p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 px-4 py-3', className)}>
      <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3.5 w-[60%]" />
          <Skeleton className="h-3 w-8 shrink-0" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonMessage({ align = 'start' }: { align?: 'start' | 'end' }) {
  return (
    <div className={cn('flex', align === 'end' ? 'justify-end' : 'justify-start')}>
      <Skeleton className={cn('h-10 w-48 rounded-xl', align === 'start' ? 'rounded-bl-sm' : 'rounded-br-sm')} />
    </div>
  )
}

export function SkeletonLabelPills({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-[72px] rounded-full" />
      ))}
    </div>
  )
}

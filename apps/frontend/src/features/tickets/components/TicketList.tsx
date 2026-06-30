import type { TicketData } from '../utils/api';
import { TicketCard } from './TicketCard';

export function TicketList({
  tickets,
  isLoading,
  isEmpty,
  emptyMessage = 'No tickets yet.',
}: {
  tickets?: TicketData[];
  isLoading: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-surface-raised h-32 animate-pulse rounded-lg border p-4"
          >
            <div className="bg-ink-muted/20 mb-3 h-4 w-3/4 rounded" />
            <div className="bg-ink-muted/20 mb-2 h-3 w-full rounded" />
            <div className="bg-ink-muted/20 h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!tickets?.length || isEmpty) {
    return (
      <div className="border-border bg-surface-raised flex flex-col items-center justify-center rounded-xl border p-12 text-center">
        <div className="bg-surface-sunken mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <h2 className="text-ink mb-1 text-[1rem] font-semibold">{emptyMessage}</h2>
        <p className="text-ink-muted max-w-xs text-[0.8125rem]">
          Tickets will appear here when they are created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

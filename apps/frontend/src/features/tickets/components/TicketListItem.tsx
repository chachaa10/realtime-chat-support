import { Link } from '@tanstack/react-router';

import type { TicketData } from '@/lib/api/tickets';

const STATUS_DOT_COLORS: Record<string, string> = {
  open: 'bg-warning',
  in_progress: 'bg-accent',
  resolved: 'bg-success',
  cancelled: 'bg-ink-dim',
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 168) return `${Math.floor(hours / 24)}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function preview(text: string, max = 60) {
  const cleaned = text.replace(/\n/g, ' ');
  return cleaned.length > max ? cleaned.slice(0, max) + '…' : cleaned;
}

interface TicketListItemProps {
  ticket: TicketData;
  isActive: boolean;
}

export function TicketListItem({ ticket, isActive }: TicketListItemProps) {
  return (
    <Link
      to="/tickets/$ticketId"
      params={{ ticketId: ticket.id.toString() }}
      className={`flex flex-col gap-0.5 border-l-3 px-4 py-3 text-left transition-colors ${
        isActive
          ? 'border-brand bg-brand/8 text-ink'
          : 'border-transparent text-ink hover:bg-surface'
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[ticket.status] ?? 'bg-ink-dim'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[0.8125rem] font-medium">{ticket.subject}</span>
            <span className="text-ink-dim shrink-0 text-[0.6875rem]">{formatTime(ticket.createdAt)}</span>
          </div>
          <p className="text-ink-muted mt-0.5 truncate text-[0.75rem] leading-snug">
            {preview(ticket.description)}
          </p>
          {ticket.labels.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {ticket.labels.slice(0, 2).map((l) => (
                <span
                  key={l.id}
                  className="inline-block rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium leading-none"
                  style={{ backgroundColor: l.color + '18', color: l.color }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

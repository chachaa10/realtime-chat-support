import { Link } from '@tanstack/react-router';

import type { TicketData } from '@/lib/api/tickets';

import { TicketStatusBadge } from './TicketStatusBadge';

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

export function TicketCard({ ticket }: { ticket: TicketData }) {
  return (
    <Link
      to="/tickets/$ticketId"
      params={{ ticketId: ticket.id.toString() }}
      className="border-border hover:bg-surface-raised block rounded-lg border p-4 transition-colors"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-ink text-[0.9375rem] leading-snug font-medium">{ticket.subject}</h3>
        <TicketStatusBadge status={ticket.status} />
      </div>
      <p className="text-ink-muted mb-3 line-clamp-2 text-[0.8125rem] leading-relaxed">
        {ticket.description}
      </p>
      <div className="flex items-center gap-2">
        {ticket.labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex h-5 items-center rounded-full px-2 text-[0.6875rem] font-medium"
            style={{
              backgroundColor: label.color + '20',
              color: label.color,
            }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <div className="text-ink-dim mt-2 flex items-center gap-3 text-[0.75rem]">
        <span>{formatTime(ticket.createdAt)}</span>
        {ticket.agent && <span>Agent assigned</span>}
      </div>
    </Link>
  );
}

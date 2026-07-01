import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchTicketEvents, type EventData } from '@/lib/api/tickets';

function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function eventLabel(event: EventData): { text: string; color: string } {
  if (event.fromStatus === null && event.toStatus === 'open') {
    return { text: 'Ticket created', color: 'bg-brand' };
  }
  if (event.fromStatus === 'open' && event.toStatus === 'in_progress') {
    const name = event.actorName ?? event.actorId;
    return { text: `Assigned to ${name}`, color: 'bg-accent' };
  }
  if (event.fromStatus === 'in_progress' && event.toStatus === 'resolved') {
    const name = event.actorName ?? event.actorId;
    return { text: `Resolved by ${name}`, color: 'bg-success' };
  }
  if (event.fromStatus === 'open' && event.toStatus === 'cancelled') {
    return { text: 'Ticket cancelled', color: 'bg-danger' };
  }
  if (event.fromStatus === 'in_progress' && event.toStatus === 'open') {
    return { text: 'Returned to queue', color: 'bg-warning' };
  }
  return { text: `${event.fromStatus ?? ''} → ${event.toStatus}`, color: 'bg-ink-dim' };
}

const CUSTOMER_VISIBLE = new Set(['open', 'in_progress', 'resolved', 'cancelled']);

interface TicketTimelineProps {
  ticketId: number;
  role: 'customer' | 'agent';
}

export function TicketTimeline({ ticketId, role }: TicketTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery<EventData[]>({
    queryKey: ['events', ticketId],
    queryFn: () => fetchTicketEvents(ticketId),
    enabled: !!ticketId,
  });

  if (isLoading || isError || !events || events.length === 0) return null;

  const visibleEvents =
    role === 'customer'
      ? events.filter((e) => e.toStatus && CUSTOMER_VISIBLE.has(e.toStatus))
      : events;

  if (visibleEvents.length === 0) return null;

  return (
    <div className="border-border border-b px-6 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 text-left"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-ink-muted transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <h3 className="text-ink-muted text-[0.75rem] font-semibold tracking-wider uppercase">
          {role === 'customer' ? 'Timeline' : 'Event Log'}
        </h3>
      </button>
      {isOpen && (
        <div className="relative mt-3 space-y-1">
          {visibleEvents.map((event, i) => {
            const { text, color } = eventLabel(event);
            const isLast = i === visibleEvents.length - 1;
            return (
              <div key={event.id} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                  {!isLast && (
                    <div className="bg-border mt-0.5 w-px flex-1" style={{ height: '1.25rem' }} />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-ink text-[0.8125rem]">{text}</p>
                  <p className="text-ink-dim text-[0.6875rem]">{formatTime(event.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

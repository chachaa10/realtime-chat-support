import { useQuery } from '@tanstack/react-query';

import { fetchTicketEvents, type EventData } from '@/lib/api/tickets';

function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function eventLabel(event: EventData): { text: string; color: string } {
  if (event.fromStatus === null && event.toStatus === 'open') {
    return { text: 'Ticket created', color: 'bg-brand' };
  }
  if (event.fromStatus === 'open' && event.toStatus === 'in_progress') {
    return { text: 'Agent assigned', color: 'bg-accent' };
  }
  if (event.fromStatus === 'in_progress' && event.toStatus === 'resolved') {
    return { text: 'Ticket resolved', color: 'bg-success' };
  }
  if (event.fromStatus === 'open' && event.toStatus === 'cancelled') {
    return { text: 'Ticket cancelled', color: 'bg-danger' };
  }
  if (event.fromStatus === 'in_progress' && event.toStatus === 'open') {
    return { text: 'Returned to queue', color: 'bg-warning' };
  }
  return { text: `${event.fromStatus ?? ''} → ${event.toStatus}`, color: 'bg-ink-dim' };
}

interface TicketTimelineProps {
  ticketId: number;
  role: 'customer' | 'agent';
}

export function TicketTimeline({ ticketId, role }: TicketTimelineProps) {
  const { data: events, isLoading, isError } = useQuery<EventData[]>({
    queryKey: ['events', ticketId],
    queryFn: () => fetchTicketEvents(ticketId),
    enabled: !!ticketId,
  });

  if (isLoading || isError || !events || events.length === 0) return null;

  return (
    <div className="border-border border-b px-6 py-4">
      <h3 className="text-ink-muted mb-3 text-[0.75rem] font-semibold uppercase tracking-wider">
        {role === 'customer' ? 'Timeline' : 'Event Log'}
      </h3>
      <div className="relative space-y-1">
        {events.map((event, i) => {
          const { text, color } = eventLabel(event);
          const isLast = i === events.length - 1;
          return (
            <div key={event.id} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                {!isLast && <div className="bg-border mt-0.5 w-px flex-1" style={{ height: '1.25rem' }} />}
              </div>
              <div className="pb-2">
                <p className="text-ink text-[0.8125rem]">{text}</p>
                <p className="text-ink-dim text-[0.6875rem]">{formatTime(event.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

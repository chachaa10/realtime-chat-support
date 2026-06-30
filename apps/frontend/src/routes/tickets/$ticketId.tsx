import { createRoute } from '@tanstack/react-router';

import { TicketDetail } from '@/features/tickets/components/TicketDetail';
import { useTicket } from '@/features/tickets/hooks/useTicket';

import { ticketsRoute } from './index';

export const ticketDetailRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/$ticketId',
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketId } = ticketDetailRoute.useParams();
  const id = Number(ticketId);
  const { data: ticket, isLoading, error } = useTicket(id);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl animate-pulse space-y-4">
          <div className="bg-ink-muted/20 h-6 w-1/2 rounded" />
          <div className="bg-ink-muted/20 h-4 w-1/3 rounded" />
          <div className="bg-surface-raised rounded-xl border p-5">
            <div className="bg-ink-muted/20 h-20 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border-border bg-surface-raised mx-auto max-w-lg rounded-xl border p-8 text-center">
          <p className="text-danger text-[0.9375rem] font-medium">
            {error instanceof Error ? error.message : 'Failed to load ticket'}
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="p-6">
      <TicketDetail ticket={ticket} />
    </div>
  );
}

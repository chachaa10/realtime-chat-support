import { useEffect } from 'react';
import { createRoute } from '@tanstack/react-router';

import { Skeleton, SkeletonText, SkeletonMessage, ErrorState } from '@/components/ui';
import { TicketConversation } from '@/features/tickets/components/TicketConversation';
import { useTicket } from '@/features/tickets/hooks/useTicket';
import { useMarkNotificationsReadByTicket } from '@/features/notifications/hooks/useNotifications';

import { ticketsRoute } from './index';

export const ticketDetailRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/$ticketId',
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketId } = ticketDetailRoute.useParams();
  const id = Number(ticketId);
  const { data: ticket, isLoading, isRefetching, error, refetch } = useTicket(id);
  const markReadByTicket = useMarkNotificationsReadByTicket();

  useEffect(() => {
    if (id) {
      markReadByTicket.mutate(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-lg" />
          <SkeletonText lines={2} className="mt-6" />
          <div className="space-y-3">
            <SkeletonMessage />
            <SkeletonMessage align="end" />
            <SkeletonMessage />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load ticket"
        error={error instanceof Error ? error : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  if (!ticket) return null;

  return (
    <>
      {isRefetching && (
        <div className="bg-brand/20 fixed top-0 right-0 left-0 z-50 h-0.5 animate-pulse" />
      )}
      <TicketConversation ticket={ticket} />
    </>
  );
}

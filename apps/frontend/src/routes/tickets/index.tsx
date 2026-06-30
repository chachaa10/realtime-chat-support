import { Outlet, createRoute, useMatch } from '@tanstack/react-router';

import { TicketSidebar } from '@/features/tickets/components/TicketSidebar';

import { rootRoute } from '../__root';
import { ticketDetailRoute } from './$ticketId';

export interface TicketSearch {
  tab?: 'my' | 'queue';
  label?: string;
}

export const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: TicketsLayout,
});

function TicketsLayout() {
  const detailMatch = useMatch({ from: ticketDetailRoute.id, shouldThrow: false });
  const activeTicketId = detailMatch ? Number(detailMatch.params.ticketId) : undefined;

  return (
    <div className="flex h-full">
      <TicketSidebar activeTicketId={activeTicketId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export const ticketsIndexRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/',
  component: TicketsIndexPage,
});

function TicketsIndexPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="bg-surface-sunken flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-muted"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-ink text-[1rem] font-semibold">Select a ticket</h2>
        <p className="text-ink-muted max-w-xs text-[0.8125rem]">
          Choose a ticket from the sidebar to view the conversation, or create a new ticket.
        </p>
      </div>
    </div>
  );
}

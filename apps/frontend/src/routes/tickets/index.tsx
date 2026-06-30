import { Link, createRoute, useSearch } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context';
import { LabelFilter } from '@/features/tickets/components/LabelFilter';
import { QueueTabs } from '@/features/tickets/components/QueueTabs';
import { TicketList } from '@/features/tickets/components/TicketList';
import { useTickets } from '@/features/tickets/hooks/useTickets';

import { rootRoute } from '../__root';

export interface TicketSearch {
  tab?: 'my' | 'queue';
  label?: string;
}

export const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  validateSearch: (search: Record<string, unknown>): TicketSearch => ({
    tab: (search.tab as 'my' | 'queue') || undefined,
    label: search.label as string | undefined,
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const { user } = useAuth();
  const search = useSearch({ from: ticketsRoute.id }) as TicketSearch;
  const isAgent = user?.role === 'agent';

  const tab = search.tab ?? (isAgent ? 'my' : 'my');
  const label = search.label;

  const { data: tickets, isLoading } = useTickets({ tab, label });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-ink text-[1.25rem] font-semibold">
            {isAgent ? (tab === 'my' ? 'My Tickets' : 'Queue') : 'My Tickets'}
          </h1>
          <p className="text-ink-muted mt-0.5 text-[0.8125rem]">
            {isAgent
              ? tab === 'my'
                ? 'Tickets you are currently handling'
                : 'Open tickets awaiting an agent'
              : 'Your support tickets'}
          </p>
        </div>
        {!isAgent && (
          <Link to="/tickets/new">
            <Button>New Ticket</Button>
          </Link>
        )}
      </div>

      {isAgent && <QueueTabs />}
      {isAgent && tab === 'queue' && <LabelFilter />}

      <TicketList
        tickets={tickets}
        isLoading={isLoading}
        emptyMessage={isAgent && tab === 'my' ? 'No tickets assigned to you' : 'No tickets yet'}
      />
    </div>
  );
}

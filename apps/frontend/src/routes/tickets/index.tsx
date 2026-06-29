import { createRoute } from '@tanstack/react-router';

import { rootRoute } from '../__root';

export const ticketsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: TicketsPage,
});

function TicketsPage() {
  return (
    <div>
      <h1>Tickets</h1>
      <p>Ticket list coming soon.</p>
    </div>
  );
}

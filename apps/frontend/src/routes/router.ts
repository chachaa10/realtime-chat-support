import { createRouter } from '@tanstack/react-router';

import { rootRoute } from './__root';
import { indexRoute } from './index';
import { loginRoute } from './login';
import { registerRoute } from './register';
import { ticketDetailRoute } from './tickets/$ticketId';
import { ticketsRoute, ticketsIndexRoute } from './tickets/index';
import { newTicketRoute } from './tickets/new';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  ticketsRoute.addChildren([ticketsIndexRoute, newTicketRoute, ticketDetailRoute]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

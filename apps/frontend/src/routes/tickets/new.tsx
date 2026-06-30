import { createRoute } from '@tanstack/react-router';

import { CreateTicketForm } from '@/features/tickets/components/CreateTicketForm';

import { ticketsRoute } from './index';

export const newTicketRoute = createRoute({
  getParentRoute: () => ticketsRoute,
  path: '/new',
  component: NewTicketPage,
});

function NewTicketPage() {
  return (
    <div className="p-6">
      <CreateTicketForm />
    </div>
  );
}

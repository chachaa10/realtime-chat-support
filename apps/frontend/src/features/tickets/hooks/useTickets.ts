import { useQuery } from '@tanstack/react-query';

import { fetchTickets } from '@/lib/api/tickets';
import type { TicketData } from '@/lib/api/tickets';

export function useTickets(params?: {
  tab?: string;
  status?: string;
  label?: string;
  sort?: string;
  cursor?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => fetchTickets(params),
    select: (data) => data.data,
  });
}

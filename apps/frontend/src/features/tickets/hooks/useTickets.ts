import { useQuery } from '@tanstack/react-query';

import { fetchTickets, type TicketData } from '@/lib/api/tickets';

export function useTickets(params?: { tab?: string; status?: string; label?: string }) {
  return useQuery<TicketData[]>({
    queryKey: ['tickets', params],
    queryFn: () => fetchTickets(params),
  });
}

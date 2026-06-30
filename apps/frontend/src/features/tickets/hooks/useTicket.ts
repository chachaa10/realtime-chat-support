import { useQuery } from '@tanstack/react-query';

import { fetchTicket, type TicketData } from '@/lib/api/tickets';

export function useTicket(id: number) {
  return useQuery<TicketData>({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id),
    enabled: !!id,
  });
}

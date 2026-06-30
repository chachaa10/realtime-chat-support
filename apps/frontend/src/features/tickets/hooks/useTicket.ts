import { useQuery } from '@tanstack/react-query';

import { fetchTicket, type TicketData } from '../utils/api';

export function useTicket(id: number) {
  return useQuery<TicketData>({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicket(id),
    enabled: !!id,
  });
}

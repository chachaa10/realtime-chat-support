import { useQuery } from '@tanstack/react-query';

import { fetchCapacityStatus, type CapacityStatus } from '@/lib/api/tickets';

export function useAgentCapacity() {
  return useQuery<CapacityStatus>({
    queryKey: ['capacity-status'],
    queryFn: fetchCapacityStatus,
    refetchInterval: 30_000,
  });
}

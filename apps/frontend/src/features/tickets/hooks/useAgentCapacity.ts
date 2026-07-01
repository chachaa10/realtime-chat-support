import { useQuery } from '@tanstack/react-query';

import { fetchCapacityStatus, type CapacityStatus } from '@/lib/api/tickets';

export function useAgentCapacity(enabled?: boolean) {
  return useQuery<CapacityStatus>({
    queryKey: ['capacity-status'],
    queryFn: fetchCapacityStatus,
    enabled,
    refetchInterval: 30_000,
  });
}

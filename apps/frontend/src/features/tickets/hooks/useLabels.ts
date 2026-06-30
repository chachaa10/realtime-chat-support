import { useQuery } from '@tanstack/react-query';

import { fetchLabels, type LabelData } from '@/lib/api/tickets';

export function useLabels() {
  return useQuery<LabelData[]>({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });
}

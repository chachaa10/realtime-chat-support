import { useQuery } from '@tanstack/react-query';

import { fetchLabels, type LabelData } from '../utils/api';

export function useLabels() {
  return useQuery<LabelData[]>({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });
}

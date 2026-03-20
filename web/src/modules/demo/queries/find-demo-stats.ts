import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { PlayerStats } from '../model';

export function useFindDemoStats(id: string, enabled = true) {
  return useQuery({
    queryKey: ['demos', id, 'stats'],
    queryFn: async () => {
      const { data } = await api.get<PlayerStats[]>(
        `/demos/${id}/stats`,
      );
      return data;
    },
    enabled: !!id && enabled,
    staleTime: Infinity,
  });
}

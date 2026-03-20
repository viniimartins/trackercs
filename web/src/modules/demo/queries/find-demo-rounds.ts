import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { DemoRound } from '../model';

export function useFindDemoRounds(id: string) {
  return useQuery({
    queryKey: ['demos', id, 'rounds'],
    queryFn: async () => {
      const { data } = await api.get<DemoRound[]>(`/demos/${id}/rounds`);
      return data;
    },
    enabled: !!id,
  });
}

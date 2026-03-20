import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { DemoFrame } from '../model';

export function useFindRoundFrames(id: string, roundNumber: number) {
  return useQuery({
    queryKey: ['demos', id, 'rounds', roundNumber, 'frames'],
    queryFn: async () => {
      const { data } = await api.get<DemoFrame[]>(
        `/demos/${id}/rounds/${roundNumber}/frames`,
      );
      return data;
    },
    enabled: !!id && roundNumber > 0,
    staleTime: Infinity,
  });
}

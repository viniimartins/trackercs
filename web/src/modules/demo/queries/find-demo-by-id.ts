import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { Demo } from '../model';

export function useFindDemoById(id: string) {
  return useQuery({
    queryKey: ['demos', id],
    queryFn: async () => {
      const { data } = await api.get<Demo>(`/demos/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

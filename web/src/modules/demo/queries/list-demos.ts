import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { Demo } from '../model';

export function useListDemos() {
  return useQuery({
    queryKey: ['demos'],
    queryFn: async () => {
      const { data } = await api.get<Demo[]>('/demos');
      return data;
    },
  });
}

import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { EventType, DemoEventMap } from '../model';

export function useFindDemoEvents<T extends EventType>(
  id: string,
  type: T,
  enabled = true,
) {
  return useQuery({
    queryKey: ['demos', id, 'events', type],
    queryFn: async () => {
      const { data } = await api.get<DemoEventMap[T]>(
        `/demos/${id}/events/${type}`,
      );
      return data;
    },
    enabled: !!id && enabled,
    staleTime: Infinity,
  });
}

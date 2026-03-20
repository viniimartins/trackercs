import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';

interface RoundEconomy {
  round: number;
  ctMoney: number;
  tMoney: number;
  ctEquip: number;
  tEquip: number;
}

export interface DemoEconomy {
  rounds: RoundEconomy[];
}

export function useFindDemoEconomy(id: string, enabled = true) {
  return useQuery({
    queryKey: ['demos', id, 'economy'],
    queryFn: async () => {
      const { data } = await api.get<DemoEconomy>(
        `/demos/${id}/economy`,
      );
      return data;
    },
    enabled: !!id && enabled,
    staleTime: Infinity,
  });
}

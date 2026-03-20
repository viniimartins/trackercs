import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';
import type { Demo } from '../model';

interface MapStat {
  map: string;
  played: number;
  wins: number;
  winRate: number;
}

interface PlayerAggregate {
  steamId: string;
  name: string;
  demos: number;
  kills: number;
  deaths: number;
  kd: number;
  adr: number;
  hsPercent: number;
  rating: number;
  kast: number;
}

interface DemoProgress {
  demoId: string;
  date: string;
  mapName: string;
  kd: number;
  adr: number;
  rating: number;
}

export interface Dashboard {
  totalDemos: number;
  totalRounds: number;
  winRate: number;
  mapStats: MapStat[];
  recentDemos: Demo[];
  playerAggregates: PlayerAggregate[];
  progressByDemo: DemoProgress[];
}

export function useFindDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<Dashboard>('/demos/dashboard');
      return data;
    },
  });
}

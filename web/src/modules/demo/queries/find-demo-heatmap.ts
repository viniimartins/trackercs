import { useQuery } from '@tanstack/react-query';

import { api } from '@/service/api';

export type HeatmapType = 'position' | 'kills' | 'deaths';

export interface DemoHeatmap {
  grid: number[][];
  maxValue: number;
  gridSize: number;
}

export function useFindDemoHeatmap(
  id: string,
  type: HeatmapType,
  enabled = true,
) {
  return useQuery({
    queryKey: ['demos', id, 'heatmap', type],
    queryFn: async () => {
      const { data } = await api.get<DemoHeatmap>(
        `/demos/${id}/heatmap`,
        { params: { type } },
      );
      return data;
    },
    enabled: !!id && enabled,
    staleTime: Infinity,
  });
}

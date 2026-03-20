import { create } from 'zustand';

import type { HeatmapType } from '@/modules/demo/queries/find-demo-heatmap';

export interface RadarLayers {
  grenades: boolean;
  lineOfSight: boolean;
  kills: boolean;
  equipment: boolean;
  damage: boolean;
  heatmap: boolean;
  heatmapType: HeatmapType;
}

interface RadarLayersState extends RadarLayers {
  toggleGrenades: () => void;
  toggleLineOfSight: () => void;
  toggleKills: () => void;
  toggleEquipment: () => void;
  toggleDamage: () => void;
  toggleHeatmap: () => void;
  setHeatmapType: (type: HeatmapType) => void;
}

export const useRadarLayersStore = create<RadarLayersState>((set) => ({
  grenades: true,
  lineOfSight: false,
  kills: true,
  equipment: false,
  damage: false,
  heatmap: false,
  heatmapType: 'position',
  toggleGrenades: () => set((s) => ({ grenades: !s.grenades })),
  toggleLineOfSight: () => set((s) => ({ lineOfSight: !s.lineOfSight })),
  toggleKills: () => set((s) => ({ kills: !s.kills })),
  toggleEquipment: () => set((s) => ({ equipment: !s.equipment })),
  toggleDamage: () => set((s) => ({ damage: !s.damage })),
  toggleHeatmap: () => set((s) => ({ heatmap: !s.heatmap })),
  setHeatmapType: (type) => set({ heatmapType: type }),
}));

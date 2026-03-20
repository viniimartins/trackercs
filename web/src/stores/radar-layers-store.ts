import { create } from 'zustand';

export interface RadarLayers {
  grenades: boolean;
  lineOfSight: boolean;
}

interface RadarLayersState extends RadarLayers {
  toggleGrenades: () => void;
  toggleLineOfSight: () => void;
}

export const useRadarLayersStore = create<RadarLayersState>((set) => ({
  grenades: true,
  lineOfSight: false,
  toggleGrenades: () => set((s) => ({ grenades: !s.grenades })),
  toggleLineOfSight: () => set((s) => ({ lineOfSight: !s.lineOfSight })),
}));

import { create } from 'zustand';

interface RadarFullscreenState {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const useRadarFullscreenStore = create<RadarFullscreenState>((set) => ({
  isFullscreen: false,
  toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),
}));

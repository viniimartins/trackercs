import { create } from 'zustand';

interface SpectatorState {
  selectedSteamId: string | null;
  setSelected: (steamId: string | null) => void;
}

export const useSpectatorStore = create<SpectatorState>((set) => ({
  selectedSteamId: null,
  setSelected: (steamId) => set({ selectedSteamId: steamId }),
}));

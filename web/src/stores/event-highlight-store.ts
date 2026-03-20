import { create } from 'zustand';

interface EventHighlight {
  gameX: number;
  gameY: number;
  attackerSteamId?: string;
}

interface EventHighlightState {
  highlight: EventHighlight | null;
  setHighlight: (highlight: EventHighlight | null) => void;
  clear: () => void;
}

export const useEventHighlightStore = create<EventHighlightState>((set) => ({
  highlight: null,
  setHighlight: (highlight) => set({ highlight }),
  clear: () => set({ highlight: null }),
}));

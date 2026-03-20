import { create } from 'zustand';

interface PlaybackState {
  isPlaying: boolean;
  currentFrameIndex: number;
  totalFrames: number;
  playbackSpeed: number;
  currentRound: number;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setFrameIndex: (index: number) => void;
  setTotalFrames: (total: number) => void;
  setRound: (round: number) => void;
  setSpeed: (speed: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  isPlaying: false,
  currentFrameIndex: 0,
  totalFrames: 0,
  playbackSpeed: 1,
  currentRound: 1,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  setFrameIndex: (index) => set({ currentFrameIndex: index }),

  setTotalFrames: (total) => set({ totalFrames: total }),

  setRound: (round) =>
    set({ currentRound: round, currentFrameIndex: 0, isPlaying: false }),

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  nextFrame: () => {
    const { currentFrameIndex, totalFrames } = get();
    if (currentFrameIndex < totalFrames - 1) {
      set({ currentFrameIndex: currentFrameIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  prevFrame: () => {
    const { currentFrameIndex } = get();
    if (currentFrameIndex > 0) {
      set({ currentFrameIndex: currentFrameIndex - 1 });
    }
  },

  reset: () =>
    set({
      isPlaying: false,
      currentFrameIndex: 0,
      totalFrames: 0,
      playbackSpeed: 1,
      currentRound: 1,
    }),
}));

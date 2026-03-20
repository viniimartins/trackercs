import { useEffect } from 'react';
import { usePlaybackStore } from '@/stores/playback-store';
import { useRadarFullscreenStore } from '@/stores/radar-fullscreen-store';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
const SKIP_FRAMES = 160;

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const store = usePlaybackStore.getState();

      switch (e.key) {
        case ' ': {
          e.preventDefault();
          store.togglePlay();
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (e.shiftKey) {
            const target = Math.max(0, store.currentFrameIndex - SKIP_FRAMES);
            store.setFrameIndex(target);
          } else if (!store.isPlaying) {
            store.prevFrame();
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (e.shiftKey) {
            const target = Math.min(
              store.totalFrames - 1,
              store.currentFrameIndex + SKIP_FRAMES,
            );
            store.setFrameIndex(target);
          } else if (!store.isPlaying) {
            store.nextFrame();
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          store.setFrameIndex(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          store.setFrameIndex(Math.max(0, store.totalFrames - 1));
          break;
        }
        case '[': {
          const idx = SPEED_OPTIONS.indexOf(store.playbackSpeed);
          if (idx > 0) store.setSpeed(SPEED_OPTIONS[idx - 1]);
          break;
        }
        case ']': {
          const idx = SPEED_OPTIONS.indexOf(store.playbackSpeed);
          if (idx < SPEED_OPTIONS.length - 1)
            store.setSpeed(SPEED_OPTIONS[idx + 1]);
          break;
        }
        case 'f':
        case 'F': {
          useRadarFullscreenStore.getState().toggleFullscreen();
          break;
        }
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

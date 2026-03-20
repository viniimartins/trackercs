'use client';

import { usePlaybackStore } from '@/stores/playback-store';
import { useMountEffect } from '@/hooks/use-mount-effect';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

interface PlaybackControlsProps {
  totalFrames: number;
}

export function PlaybackControls({ totalFrames }: PlaybackControlsProps) {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const currentFrameIndex = usePlaybackStore((s) => s.currentFrameIndex);
  const playbackSpeed = usePlaybackStore((s) => s.playbackSpeed);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const setFrameIndex = usePlaybackStore((s) => s.setFrameIndex);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const setTotalFrames = usePlaybackStore((s) => s.setTotalFrames);

  useMountEffect(() => {
    setTotalFrames(totalFrames);
  }, [totalFrames, setTotalFrames]);

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2l10 6-10 6V2z" />
          </svg>
        )}
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(totalFrames - 1, 0)}
        value={currentFrameIndex}
        onChange={(e) => setFrameIndex(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />

      <span className="text-zinc-400 text-sm tabular-nums min-w-[80px] text-right">
        {currentFrameIndex + 1} / {totalFrames}
      </span>

      <div className="flex items-center gap-1">
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed}
            onClick={() => setSpeed(speed)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              playbackSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}

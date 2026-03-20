'use client';

import { useRef, useCallback } from 'react';
import { usePlaybackStore } from '@/stores/playback-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TimelineEvent } from '../_hooks/use-round-timeline-events';

interface RoundTimelineProps {
  events: TimelineEvent[];
  totalFrames: number;
}

const EVENT_COLORS: Record<string, string> = {
  kill: '#ef4444',
  bomb_plant: '#f97316',
  bomb_defuse: '#3b82f6',
  bomb_explode: '#dc2626',
};

export function RoundTimeline({ events, totalFrames }: RoundTimelineProps) {
  const currentFrameIndex = usePlaybackStore((s) => s.currentFrameIndex);
  const setFrameIndex = usePlaybackStore((s) => s.setFrameIndex);
  const barRef = useRef<HTMLDivElement>(null);

  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar || totalFrames === 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setFrameIndex(Math.round(ratio * (totalFrames - 1)));
    },
    [totalFrames, setFrameIndex],
  );

  const handleEventClick = useCallback(
    (frameIndex: number) => {
      setFrameIndex(Math.max(0, Math.min(frameIndex, totalFrames - 1)));
    },
    [totalFrames, setFrameIndex],
  );

  const playheadPercent = totalFrames > 0 ? (currentFrameIndex / (totalFrames - 1)) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="px-3 py-1">
        <div
          ref={barRef}
          className="relative h-5 bg-muted rounded-md cursor-pointer"
          onClick={handleBarClick}
        >
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 shadow-[0_0_6px_var(--primary)]"
            style={{ left: `${playheadPercent}%` }}
          />

          {/* Events */}
          {events.map((event, i) => {
            const percent =
              totalFrames > 0
                ? (event.frameIndex / (totalFrames - 1)) * 100
                : 0;

            return (
              <Tooltip key={i}>
                <TooltipTrigger
                  render={
                    <div
                      className="absolute top-0.5 bottom-0.5 flex items-center z-20 cursor-pointer"
                      style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event.frameIndex);
                      }}
                    >
                      {event.type === 'kill' ? (
                        <SkullIcon color={EVENT_COLORS.kill} />
                      ) : event.type === 'bomb_plant' ? (
                        <BombIcon color={EVENT_COLORS.bomb_plant} />
                      ) : event.type === 'bomb_defuse' ? (
                        <ShieldIcon color={EVENT_COLORS.bomb_defuse} />
                      ) : (
                        <BombIcon color={EVENT_COLORS.bomb_explode} />
                      )}
                    </div>
                  }
                />
                <TooltipContent side="top">{event.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

function SkullIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color} className="drop-shadow-sm">
      <circle cx="12" cy="10" r="8" />
      <circle cx="9" cy="9" r="2" fill="#000" />
      <circle cx="15" cy="9" r="2" fill="#000" />
      <rect x="10" y="14" width="1.5" height="3" fill="#000" />
      <rect x="12.5" y="14" width="1.5" height="3" fill="#000" />
    </svg>
  );
}

function BombIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color} className="drop-shadow-sm">
      <circle cx="12" cy="14" r="8" />
      <rect x="11" y="2" width="2" height="6" rx="1" />
    </svg>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={color} className="drop-shadow-sm">
      <path d="M12 2L4 6v6c0 5.25 3.4 10.2 8 12 4.6-1.8 8-6.75 8-12V6l-8-4z" />
    </svg>
  );
}

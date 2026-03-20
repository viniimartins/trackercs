'use client';

import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronFirst,
  ChevronLast,
  Minus,
  Plus,
  PenTool,
} from 'lucide-react';
import { usePlaybackStore } from '@/stores/playback-store';
import { useTacticalBoardStore } from '@/stores/tactical-board-store';
import { useMountEffect } from '@/hooks/use-mount-effect';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useKeyboardShortcuts } from '../_hooks/use-keyboard-shortcuts';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];
const SKIP_FRAMES = 160;

function formatFrameTime(frameIndex: number, tickRate = 32): string {
  const totalSeconds = Math.floor(frameIndex / tickRate);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface PlaybackControlsProps {
  totalFrames: number;
}

export function PlaybackControls({ totalFrames }: PlaybackControlsProps) {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const currentFrameIndex = usePlaybackStore((s) => s.currentFrameIndex);
  const playbackSpeed = usePlaybackStore((s) => s.playbackSpeed);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const setTotalFrames = usePlaybackStore((s) => s.setTotalFrames);
  const setFrameIndex = usePlaybackStore((s) => s.setFrameIndex);
  const isTacticalActive = useTacticalBoardStore((s) => s.isActive);
  const toggleTactical = useTacticalBoardStore((s) => s.toggleActive);

  useMountEffect(() => {
    setTotalFrames(totalFrames);
  }, [totalFrames, setTotalFrames]);

  useKeyboardShortcuts();

  const clamp = (value: number) =>
    Math.max(0, Math.min(totalFrames - 1, value));

  const speedIndex = SPEED_OPTIONS.indexOf(playbackSpeed);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Transport */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setFrameIndex(0)}
                />
              }
            >
              <ChevronFirst className="size-3" />
            </TooltipTrigger>
            <TooltipContent>First frame (Home)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setFrameIndex(clamp(currentFrameIndex - SKIP_FRAMES))
                  }
                />
              }
            >
              <SkipBack className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Skip back 5s (Shift+Left)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={isPlaying ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={togglePlay}
                />
              }
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? 'Pause' : 'Play'} (Space)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setFrameIndex(clamp(currentFrameIndex + SKIP_FRAMES))
                  }
                />
              }
            >
              <SkipForward className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Skip forward 5s (Shift+Right)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setFrameIndex(clamp(totalFrames - 1))}
                />
              }
            >
              <ChevronLast className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Last frame (End)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Time */}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium tabular-nums">
            {formatFrameTime(currentFrameIndex)}
          </span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatFrameTime(totalFrames)}
          </span>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Speed */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (speedIndex > 0)
                      setSpeed(SPEED_OPTIONS[speedIndex - 1]);
                  }}
                  disabled={speedIndex <= 0}
                />
              }
            >
              <Minus className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Slower ([)</TooltipContent>
          </Tooltip>

          <Slider
            className="w-24"
            min={0}
            max={SPEED_OPTIONS.length - 1}
            step={1}
            value={[speedIndex >= 0 ? speedIndex : 2]}
            onValueChange={(val) => {
              const arr = Array.isArray(val) ? val : [val];
              setSpeed(SPEED_OPTIONS[arr[0]]);
            }}
          />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (speedIndex < SPEED_OPTIONS.length - 1)
                      setSpeed(SPEED_OPTIONS[speedIndex + 1]);
                  }}
                  disabled={speedIndex >= SPEED_OPTIONS.length - 1}
                />
              }
            >
              <Plus className="size-3" />
            </TooltipTrigger>
            <TooltipContent>Faster (])</TooltipContent>
          </Tooltip>

          <span className="text-xs tabular-nums font-medium w-8 text-right">
            {playbackSpeed}x
          </span>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Tactical board toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={isTacticalActive ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleTactical}
              />
            }
          >
            <PenTool className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Tactical Board</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

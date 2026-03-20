import { useRef, useCallback } from 'react';
import { usePlaybackStore } from '@/stores/playback-store';
import { useMountEffect } from '@/hooks/use-mount-effect';
import type { DemoFrame } from '@/modules/demo/model';

export function usePlaybackLoop(frames: DemoFrame[]) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const playbackSpeed = usePlaybackStore((s) => s.playbackSpeed);
  const nextFrame = usePlaybackStore((s) => s.nextFrame);
  const setTotalFrames = usePlaybackStore((s) => s.setTotalFrames);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const speedRef = useRef(playbackSpeed);
  speedRef.current = playbackSpeed;

  const nextFrameRef = useRef(nextFrame);
  nextFrameRef.current = nextFrame;

  const framesLenRef = useRef(frames.length);
  framesLenRef.current = frames.length;

  const loop = useCallback((time: number) => {
    if (!isPlayingRef.current) {
      rafRef.current = requestAnimationFrame(loop);
      lastTimeRef.current = time;
      return;
    }

    const delta = time - lastTimeRef.current;
    const interval = 1000 / (16 * speedRef.current);

    if (delta >= interval) {
      nextFrameRef.current();
      lastTimeRef.current = time;
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useMountEffect(() => {
    setTotalFrames(frames.length);
  }, [frames.length, setTotalFrames]);

  useMountEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);
}

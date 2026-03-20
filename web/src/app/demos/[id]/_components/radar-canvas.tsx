'use client';

import { useRef, useCallback } from 'react';
import { useMountEffect } from '@/hooks/use-mount-effect';
import { useRadarRenderer } from '../_hooks/use-radar-renderer';
import { useRadarLayersStore } from '@/stores/radar-layers-store';
import { RadarLayerControls } from './radar-layer-controls';
import type { DemoFrame, GrenadeEvent } from '@/modules/demo/model';

interface RadarCanvasProps {
  mapName: string;
  frame: DemoFrame | null;
  grenades?: GrenadeEvent[];
}

export function RadarCanvas({ mapName, frame, grenades }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { render } = useRadarRenderer();
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const mapNameRef = useRef(mapName);
  mapNameRef.current = mapName;

  const renderRef = useRef(render);
  renderRef.current = render;

  const grenadesRef = useRef(grenades);
  grenadesRef.current = grenades;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const layers = useRadarLayersStore.getState();
    renderRef.current(ctx, canvas, mapNameRef.current, frameRef.current, {
      grenades: grenadesRef.current,
      layers: { grenades: layers.grenades, lineOfSight: layers.lineOfSight },
    });
  }, []);

  useMountEffect(() => {
    let rafId: number;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={1024}
        height={1024}
        className="max-w-full max-h-full aspect-square rounded-lg"
      />
      <RadarLayerControls />
    </div>
  );
}

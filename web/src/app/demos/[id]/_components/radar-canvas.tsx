'use client';

import { useRef, useCallback } from 'react';
import { useMountEffect } from '@/hooks/use-mount-effect';
import { useRadarRenderer, MAP_CONFIGS, gameToRadar } from '../_hooks/use-radar-renderer';
import { useRadarLayersStore } from '@/stores/radar-layers-store';
import { useSpectatorStore } from '@/stores/spectator-store';
import { RadarLayerControls } from './radar-layer-controls';
import { Card } from '@/components/ui/card';
import { useRadarFullscreenStore } from '@/stores/radar-fullscreen-store';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { DemoFrame, GrenadeEvent, KillEvent, DamageEvent } from '@/modules/demo/model';
import type { HeatmapData } from '../_hooks/use-radar-renderer';

const HIT_TEST_RADIUS = 15;

interface RadarCanvasProps {
  mapName: string;
  frame: DemoFrame | null;
  grenades?: GrenadeEvent[];
  kills?: KillEvent[];
  damages?: DamageEvent[];
  heatmap?: HeatmapData | null;
}

export function RadarCanvas({ mapName, frame, grenades, kills, damages, heatmap }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { render } = useRadarRenderer();
  const isFullscreen = useRadarFullscreenStore((s) => s.isFullscreen);
  const toggleFullscreen = useRadarFullscreenStore((s) => s.toggleFullscreen);

  const frameRef = useRef(frame);
  frameRef.current = frame;

  const mapNameRef = useRef(mapName);
  mapNameRef.current = mapName;

  const renderRef = useRef(render);
  renderRef.current = render;

  const grenadesRef = useRef(grenades);
  grenadesRef.current = grenades;

  const killsRef = useRef(kills);
  killsRef.current = kills;

  const damagesRef = useRef(damages);
  damagesRef.current = damages;

  const heatmapRef = useRef(heatmap);
  heatmapRef.current = heatmap;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const layers = useRadarLayersStore.getState();
    const selectedSteamId = useSpectatorStore.getState().selectedSteamId;
    renderRef.current(ctx, canvas, mapNameRef.current, frameRef.current, {
      grenades: grenadesRef.current,
      kills: killsRef.current,
      damages: damagesRef.current,
      layers,
      selectedSteamId,
      heatmap: heatmapRef.current,
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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const currentFrame = frameRef.current;
      const currentMap = mapNameRef.current;
      if (!canvas || !currentFrame) return;

      const config = MAP_CONFIGS[currentMap];
      if (!config) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      const size = canvas.width;
      const radarScale = size / 1024;

      let closestId: string | null = null;
      let closestDist = Infinity;

      for (const player of currentFrame.players) {
        if (!player.isAlive) continue;
        const pos = gameToRadar(player.x, player.y, config);
        const px = pos.x * radarScale;
        const py = pos.y * radarScale;
        const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = player.steamId;
        }
      }

      const setSelected = useSpectatorStore.getState().setSelected;
      if (closestId && closestDist < HIT_TEST_RADIUS * radarScale) {
        setSelected(closestId);
      } else {
        setSelected(null);
      }
    },
    [],
  );

  return (
    <Card className="relative p-0 overflow-hidden w-full h-full">
      <canvas
        ref={canvasRef}
        width={1024}
        height={1024}
        className="max-w-full max-h-full aspect-square rounded-lg cursor-default block mx-auto"
        onClick={handleClick}
      />
      <button
        className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm rounded-lg p-1.5 ring-1 ring-border hover:bg-card/90 transition-colors"
        onClick={toggleFullscreen}
      >
        {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </button>
      <RadarLayerControls />
    </Card>
  );
}

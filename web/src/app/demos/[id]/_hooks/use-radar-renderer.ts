import { useRef, useCallback } from 'react';
import type { DemoFrame, FramePlayer, GrenadeEvent } from '@/modules/demo/model';
import type { RadarLayers } from '@/stores/radar-layers-store';

interface MapConfig {
  pos_x: number;
  pos_y: number;
  scale: number;
}

const MAP_CONFIGS: Record<string, MapConfig> = {
  de_dust2: { pos_x: -2476, pos_y: 3239, scale: 4.4 },
  de_mirage: { pos_x: -3230, pos_y: 1713, scale: 5.0 },
  de_inferno: { pos_x: -2087, pos_y: 3870, scale: 4.9 },
  de_nuke: { pos_x: -3453, pos_y: 2887, scale: 7.0 },
  de_overpass: { pos_x: -4831, pos_y: 1781, scale: 5.2 },
  de_ancient: { pos_x: -2953, pos_y: 2164, scale: 5.0 },
  de_anubis: { pos_x: -2796, pos_y: 3328, scale: 5.22 },
  de_vertigo: { pos_x: -3168, pos_y: 1762, scale: 4.0 },
};

const RADAR_SIZE = 1024;
const CT_COLOR = '#5b9bd5';
const T_COLOR = '#e6c84c';
const DEAD_COLOR = '#666666';
const BOMB_COLOR = '#ff3333';

const GRENADE_DURATIONS: Record<string, number> = {
  smokegrenade: 350,
  molotov: 200,
  flashbang: 10,
  hegrenade: 5,
  decoy: 400,
};

const GRENADE_COLORS: Record<string, string> = {
  smokegrenade: 'rgba(180, 180, 180, 0.4)',
  flashbang: 'rgba(255, 255, 255, 0.5)',
  hegrenade: 'rgba(255, 60, 60, 0.4)',
  molotov: 'rgba(255, 140, 0, 0.4)',
  decoy: 'rgba(200, 200, 100, 0.3)',
};

function gameToRadar(
  gameX: number,
  gameY: number,
  config: MapConfig,
): { x: number; y: number } {
  return {
    x: (gameX - config.pos_x) / config.scale,
    y: (config.pos_y - gameY) / config.scale,
  };
}

interface RenderOptions {
  grenades?: GrenadeEvent[];
  layers: RadarLayers;
}

export function useRadarRenderer() {
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgLoadedMapRef = useRef<string>('');

  const render = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      mapName: string,
      frame: DemoFrame | null,
      options?: RenderOptions,
    ) => {
      const config = MAP_CONFIGS[mapName];
      const size = canvas.width;
      const scale = size / RADAR_SIZE;

      ctx.clearRect(0, 0, size, size);

      if (bgImageRef.current && bgLoadedMapRef.current === mapName) {
        ctx.drawImage(bgImageRef.current, 0, 0, size, size);
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);

        if (bgLoadedMapRef.current !== mapName) {
          bgLoadedMapRef.current = mapName;
          const img = new Image();
          img.src = `/maps/${mapName}_radar.png`;
          img.onload = () => {
            bgImageRef.current = img;
          };
        }
      }

      if (!frame || !config) return;

      // Draw grenades
      if (options?.layers.grenades && options?.grenades) {
        for (const grenade of options.grenades) {
          const duration = GRENADE_DURATIONS[grenade.grenadeType] ?? 10;
          const tickDiff = frame.tick - grenade.tick;
          if (tickDiff < 0 || tickDiff > duration) continue;

          const pos = gameToRadar(grenade.x, grenade.y, config);
          const gx = pos.x * scale;
          const gy = pos.y * scale;
          drawGrenade(ctx, gx, gy, grenade.grenadeType, scale);
        }
      }

      // Draw bomb
      if (frame.bomb) {
        const bp = gameToRadar(frame.bomb.x, frame.bomb.y, config);
        const bx = bp.x * scale;
        const by = bp.y * scale;
        const bombSize = 6 * scale;

        ctx.save();
        ctx.translate(bx, by);

        if (frame.bomb.state === 'planted') {
          const pulse = 1 + Math.sin(Date.now() / 200) * 0.3;
          ctx.scale(pulse, pulse);
        }

        ctx.fillStyle = BOMB_COLOR;
        ctx.beginPath();
        ctx.moveTo(0, -bombSize);
        ctx.lineTo(bombSize, 0);
        ctx.lineTo(0, bombSize);
        ctx.lineTo(-bombSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw players
      for (const player of frame.players) {
        const pos = gameToRadar(player.x, player.y, config);
        const px = pos.x * scale;
        const py = pos.y * scale;

        if (!player.isAlive) {
          drawDeadPlayer(ctx, px, py, scale);
          continue;
        }

        const color = player.team === 'CT' ? CT_COLOR : T_COLOR;
        drawPlayer(ctx, px, py, player.yaw, color, player.name, player.health, scale);

        // Draw line of sight
        if (options?.layers.lineOfSight) {
          drawLineOfSight(ctx, px, py, player.yaw, color, scale);
        }
      }
    },
    [],
  );

  return { render };
}

function drawGrenade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  scale: number,
) {
  const radius = type === 'smokegrenade' ? 15 * scale : 8 * scale;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = GRENADE_COLORS[type] ?? 'rgba(200, 200, 200, 0.3)';
  ctx.fill();
}

function drawLineOfSight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  yaw: number,
  color: string,
  scale: number,
) {
  const yawRad = ((yaw - 90) * Math.PI) / 180;
  const length = 60 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(yawRad) * length, y + Math.sin(yawRad) * length);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  yaw: number,
  color: string,
  name: string,
  health: number,
  scale: number,
) {
  const radius = 8 * scale;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  const yawRad = ((yaw - 90) * Math.PI) / 180;
  const dirLen = radius * 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(yawRad) * dirLen, y + Math.sin(yawRad) * dirLen);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  ctx.font = `${10 * scale}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2 * scale;
  ctx.strokeText(name, x, y - radius - 6 * scale);
  ctx.fillText(name, x, y - radius - 6 * scale);

  if (health < 100) {
    const barWidth = 20 * scale;
    const barHeight = 3 * scale;
    const barX = x - barWidth / 2;
    const barY = y + radius + 3 * scale;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = health > 50 ? '#4ade80' : health > 25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * (health / 100), barHeight);
  }
}

function drawDeadPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  const size = 5 * scale;
  ctx.strokeStyle = DEAD_COLOR;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
}

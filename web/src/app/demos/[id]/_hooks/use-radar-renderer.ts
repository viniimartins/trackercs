import { useRef, useCallback } from 'react';
import type { DemoFrame, FramePlayer, GrenadeEvent, KillEvent, DamageEvent } from '@/modules/demo/model';
import type { RadarLayers } from '@/stores/radar-layers-store';
import { normalizeWeapon } from '../_utils/format-weapon';

interface MapConfig {
  pos_x: number;
  pos_y: number;
  scale: number;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
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
const DAMAGE_VISIBLE_TICKS = 16;

const GRENADE_DURATIONS: Record<string, number> = {
  smokegrenade: 350,
  molotov: 200,
  flashbang: 10,
  hegrenade: 5,
  decoy: 400,
};

const WEAPON_ABBREVS: Record<string, string> = {
  ak47: 'AK',
  m4a1: 'M4',
  m4a1_silencer: 'M4S',
  awp: 'AWP',
  deagle: 'DEA',
  usp_silencer: 'USP',
  glock: 'GLK',
  famas: 'FAM',
  galilar: 'GAL',
  ssg08: 'SCT',
  aug: 'AUG',
  sg556: 'SG',
  mp9: 'MP9',
  mac10: 'MAC',
  mp7: 'MP7',
  ump45: 'UMP',
  p90: 'P90',
  bizon: 'BIZ',
  mp5sd: 'MP5',
  nova: 'NOV',
  xm1014: 'XM',
  mag7: 'MAG',
  sawedoff: 'SAW',
  negev: 'NEG',
  m249: 'M249',
  p250: 'P250',
  tec9: 'TEC',
  cz75a: 'CZ',
  fiveseven: '57',
  elite: 'DUL',
  revolver: 'REV',
  hkp2000: 'P2K',
  knife: 'KNF',
  knife_t: 'KNF',
  bayonet: 'KNF',
  c4: 'C4',
  hegrenade: 'HE',
  flashbang: 'FB',
  smokegrenade: 'SMK',
  molotov: 'MOL',
  incgrenade: 'INC',
  decoy: 'DCY',
  taser: 'ZAP',
};

function weaponAbbrev(name: string): string {
  const internal = normalizeWeapon(name);
  return WEAPON_ABBREVS[internal] ?? internal.substring(0, 3).toUpperCase();
}

export function gameToRadar(
  gameX: number,
  gameY: number,
  config: MapConfig,
): { x: number; y: number } {
  return {
    x: (gameX - config.pos_x) / config.scale,
    y: (config.pos_y - gameY) / config.scale,
  };
}

interface RadarTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface HeatmapData {
  grid: number[][];
  maxValue: number;
  gridSize: number;
}

export interface EventHighlightPos {
  gameX: number;
  gameY: number;
}

interface RenderOptions {
  grenades?: GrenadeEvent[];
  kills?: KillEvent[];
  damages?: DamageEvent[];
  layers: RadarLayers;
  transform?: RadarTransform;
  selectedSteamId?: string | null;
  heatmap?: HeatmapData | null;
  eventHighlight?: EventHighlightPos | null;
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

      // Apply pan/zoom transform
      const t = options?.transform;
      if (t) {
        ctx.save();
        ctx.translate(t.offsetX, t.offsetY);
        ctx.scale(t.scale, t.scale);
      }

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

      // Heatmap overlay (renders even without frame)
      if (options?.layers.heatmap && options?.heatmap && options.heatmap.maxValue > 0) {
        drawHeatmap(ctx, size, options.heatmap);
      }

      if (!frame || !config) {
        if (t) ctx.restore();
        return;
      }

      // 1. Damage lines (background layer)
      if (options?.layers.damage && options?.damages) {
        for (const dmg of options.damages) {
          const tickDiff = frame.tick - dmg.tick;
          if (tickDiff < 0 || tickDiff > DAMAGE_VISIBLE_TICKS) continue;

          const attacker = frame.players.find((p) => p.steamId === dmg.attackerSteamId);
          const victim = frame.players.find((p) => p.steamId === dmg.victimSteamId);
          if (!attacker || !victim) continue;

          const aPos = gameToRadar(attacker.x, attacker.y, config);
          const vPos = gameToRadar(victim.x, victim.y, config);
          const alpha = 1 - tickDiff / DAMAGE_VISIBLE_TICKS;
          drawDamageLine(
            ctx,
            aPos.x * scale, aPos.y * scale,
            vPos.x * scale, vPos.y * scale,
            alpha, dmg.dmgHealth, scale,
          );
        }
      }

      // 2. Grenades
      if (options?.layers.grenades && options?.grenades) {
        for (const grenade of options.grenades) {
          const duration = GRENADE_DURATIONS[grenade.grenadeType] ?? 10;
          const tickDiff = frame.tick - grenade.tick;
          if (tickDiff < 0 || tickDiff > duration) continue;

          const pos = gameToRadar(grenade.x, grenade.y, config);
          const gx = pos.x * scale;
          const gy = pos.y * scale;
          const progress = tickDiff / duration;
          drawGrenade(ctx, gx, gy, grenade.grenadeType, scale, progress);
        }
      }

      // 3. Kill markers
      if (options?.layers.kills && options?.kills) {
        for (const kill of options.kills) {
          if (kill.tick > frame.tick) continue;
          const pos = gameToRadar(kill.x, kill.y, config);
          drawKillMarker(ctx, pos.x * scale, pos.y * scale, scale, kill.headshot);
        }
      }

      // 4. Bomb
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

      // 5. Players with equipment
      for (const player of frame.players) {
        const pos = gameToRadar(player.x, player.y, config);
        const px = pos.x * scale;
        const py = pos.y * scale;

        if (!player.isAlive) {
          drawDeadPlayer(ctx, px, py, scale);
          continue;
        }

        const color = player.team === 'CT' ? CT_COLOR : T_COLOR;
        drawPlayer(
          ctx, px, py, player.yaw, color, player.name, player.health, scale,
          options?.layers.equipment ? player : undefined,
        );

        // Selected player highlight ring
        if (options?.selectedSteamId === player.steamId) {
          drawSelectionRing(ctx, px, py, scale);
        }

        // Draw line of sight
        if (options?.layers.lineOfSight) {
          drawLineOfSight(ctx, px, py, player.yaw, color, scale);
        }
      }

      // 6. Event highlight ring
      if (options?.eventHighlight) {
        const hp = gameToRadar(options.eventHighlight.gameX, options.eventHighlight.gameY, config);
        drawEventHighlight(ctx, hp.x * scale, hp.y * scale, scale);
      }

      if (t) ctx.restore();
    },
    [],
  );

  return { render };
}

function drawSelectionRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  const radius = 8 * scale;
  const pulse = 1 + Math.sin(Date.now() / 300) * 0.15;
  const ringRadius = (radius + 6 * scale) * pulse;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 300) * 0.3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawEventHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  const now = Date.now();
  const pulse = 1 + Math.sin(now / 250) * 0.2;
  const baseRadius = 14 * scale;
  const radius = baseRadius * pulse;
  const alpha = 0.6 + Math.sin(now / 250) * 0.2;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();

  // Inner fill
  ctx.globalAlpha = alpha * 0.15;
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Crosshair lines
  ctx.globalAlpha = alpha * 0.5;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1 * scale;
  const arm = radius + 4 * scale;
  const gap = 5 * scale;
  ctx.beginPath();
  ctx.moveTo(x - arm, y); ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y); ctx.lineTo(x + arm, y);
  ctx.moveTo(x, y - arm); ctx.lineTo(x, y - gap);
  ctx.moveTo(x, y + gap); ctx.lineTo(x, y + arm);
  ctx.stroke();

  ctx.restore();
}

function drawGrenade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  scale: number,
  progress: number,
) {
  switch (type) {
    case 'smokegrenade':
      drawSmoke(ctx, x, y, scale, progress);
      break;
    case 'flashbang':
      drawFlash(ctx, x, y, scale, progress);
      break;
    case 'hegrenade':
      drawHE(ctx, x, y, scale, progress);
      break;
    case 'molotov':
      drawMolotov(ctx, x, y, scale, progress);
      break;
    case 'decoy':
      drawDecoy(ctx, x, y, scale, progress);
      break;
    default: {
      ctx.beginPath();
      ctx.arc(x, y, 8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.fill();
    }
  }
}

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
) {
  const maxRadius = 18 * scale;
  let alpha: number;
  let radius: number;

  if (progress < 0.15) {
    const t = progress / 0.15;
    radius = maxRadius * t;
    alpha = 0.65 * t;
  } else if (progress < 0.8) {
    radius = maxRadius;
    const breathe = Math.sin(Date.now() / 600) * 0.05;
    alpha = 0.65 + breathe;
  } else {
    const t = (progress - 0.8) / 0.2;
    radius = maxRadius * (1 + t * 0.1);
    alpha = 0.65 * (1 - t);
  }

  const now = Date.now();

  ctx.save();
  ctx.globalAlpha = alpha;

  // Draw cloud as a wobbly path for organic shape
  ctx.beginPath();
  const points = 32;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // 4 wobble frequencies at different phases
    const wobble =
      1 +
      0.06 * Math.sin(angle * 3 + now / 700) +
      0.05 * Math.cos(angle * 5 + now / 900) +
      0.04 * Math.sin(angle * 7 + now / 1100) +
      0.03 * Math.cos(angle * 2 + now / 800);
    const r = radius * wobble;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Solid gray fill with feathered edge via radial gradient
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.1);
  grad.addColorStop(0, 'rgba(160, 165, 170, 1)');
  grad.addColorStop(0.7, 'rgba(155, 160, 165, 0.95)');
  grad.addColorStop(1, 'rgba(150, 155, 160, 0)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

function drawFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
) {
  const maxRadius = 18 * scale;
  // Sharper cubic falloff
  const fade = Math.pow(1 - progress, 3);
  // Fast ease-out expansion
  const expand = 1 - Math.pow(1 - progress, 2);
  const radius = maxRadius * (0.2 + 0.8 * expand);

  ctx.save();

  // Outer glow ring
  ctx.globalAlpha = fade * 0.4;
  const glowGrad = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
  glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  glowGrad.addColorStop(0.5, 'rgba(255, 255, 240, 0.6)');
  glowGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = glowGrad;
  ctx.fill();

  // Solid white core
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 6 radial rays (starburst)
  ctx.globalAlpha = fade * 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  const rayLen = radius * 0.9;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.15, y + Math.sin(angle) * radius * 0.15);
    ctx.lineTo(x + Math.cos(angle) * rayLen, y + Math.sin(angle) * rayLen);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHE(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
) {
  const maxRingRadius = 14 * scale;
  const ringRadius = maxRingRadius * progress;
  const ringAlpha = 1 - progress;

  // Shockwave ring — wide glow layer
  ctx.save();
  ctx.globalAlpha = ringAlpha * 0.35;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 180, 80, 1)';
  ctx.lineWidth = 5 * scale * (1 - progress * 0.5);
  ctx.stroke();
  ctx.restore();

  // Shockwave ring — thin bright layer
  ctx.save();
  ctx.globalAlpha = ringAlpha * 0.9;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 200, 100, 1)';
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();
  ctx.restore();

  // Fireball — brighter gradient
  const fireRadius =
    progress < 0.4
      ? 10 * scale * (progress / 0.4)
      : 10 * scale * (1 - (progress - 0.4) / 0.6);
  const fireAlpha = progress < 0.4 ? 1 : 1 * (1 - (progress - 0.4) / 0.6);

  if (fireRadius > 0) {
    ctx.save();
    ctx.globalAlpha = fireAlpha;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, fireRadius);
    grad.addColorStop(0, 'rgba(255, 255, 240, 1)');
    grad.addColorStop(0.3, 'rgba(255, 230, 80, 1)');
    grad.addColorStop(0.6, 'rgba(255, 130, 0, 0.8)');
    grad.addColorStop(1, 'rgba(200, 30, 0, 0)');
    ctx.beginPath();
    ctx.arc(x, y, fireRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // Spark particles — seeded by position for frame consistency
  const seed = Math.abs(Math.round(x * 100 + y * 7));
  const sparkCount = 7;
  if (progress > 0.05 && progress < 0.85) {
    ctx.save();
    const sparkFade = progress < 0.4 ? 1 : 1 - (progress - 0.4) / 0.45;
    ctx.globalAlpha = sparkFade;
    for (let i = 0; i < sparkCount; i++) {
      // Pseudo-random angle and speed from seed
      const hash = ((seed * (i + 1) * 2654435761) >>> 0) / 4294967296;
      const angle = hash * Math.PI * 2;
      const speed = 0.6 + hash * 0.8;
      const dist = maxRingRadius * progress * speed;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 * scale, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 230, 100, 1)' : 'rgba(255, 180, 60, 1)';
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMolotov(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
) {
  let alpha: number;
  let radius: number;
  const maxRadius = 14 * scale;

  if (progress < 0.1) {
    const t = progress / 0.1;
    radius = maxRadius * t;
    alpha = 0.8 * t;
  } else if (progress < 0.85) {
    radius = maxRadius;
    alpha = 0.8;
  } else {
    const t = (progress - 0.85) / 0.15;
    radius = maxRadius * (1 - t * 0.5);
    alpha = 0.8 * (1 - t);
  }

  const now = Date.now();
  // Stronger flicker: 0.6-0.9 range
  const flicker = 0.75 + 0.15 * Math.sin(now / 50) + 0.1 * Math.cos(now / 80);

  ctx.save();
  ctx.globalAlpha = alpha * flicker;

  // Irregular fire pool via wobbly path with 8 control points
  ctx.beginPath();
  const controlPoints = 8;
  const segments = 32;
  // Pre-compute control point radii with wobble
  const cpRadii: number[] = [];
  for (let i = 0; i < controlPoints; i++) {
    const freq = 300 + i * 70;
    const phase = i * 1.3;
    const wobble = 0.85 + 0.15 * Math.sin(now / freq + phase);
    cpRadii.push(radius * wobble);
  }

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Interpolate between control point radii for smooth shape
    const cpPos = (i / segments) * controlPoints;
    const cpIdx = Math.floor(cpPos) % controlPoints;
    const cpNext = (cpIdx + 1) % controlPoints;
    const cpFrac = cpPos - Math.floor(cpPos);
    // Smooth interpolation
    const t = cpFrac * cpFrac * (3 - 2 * cpFrac);
    const r = cpRadii[cpIdx] * (1 - t) + cpRadii[cpNext] * t;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Stronger gradient: white-hot center → orange → dark red
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
  grad.addColorStop(0.3, 'rgba(255, 200, 50, 0.95)');
  grad.addColorStop(0.6, 'rgba(255, 120, 0, 0.7)');
  grad.addColorStop(1, 'rgba(180, 30, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Ember particles — small bright dots drifting upward
  if (radius > 0) {
    const emberCount = 4;
    for (let i = 0; i < emberCount; i++) {
      const seed = i * 1.7;
      // Cycle position using time
      const cycle = ((now / (800 + i * 200)) + seed) % 1;
      const ex = x + Math.sin(seed * 5 + now / 600) * radius * 0.5;
      const ey = y - cycle * radius * 1.2;
      const emberAlpha = cycle < 0.7 ? 1 : 1 - (cycle - 0.7) / 0.3;
      ctx.globalAlpha = alpha * emberAlpha * 0.9;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 240, 100, 1)' : 'rgba(255, 200, 60, 1)';
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawDecoy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
) {
  let alpha: number;
  if (progress < 0.05) {
    alpha = progress / 0.05;
  } else if (progress > 0.9) {
    alpha = (1 - progress) / 0.1;
  } else {
    alpha = 1;
  }

  const now = Date.now();

  ctx.save();
  ctx.globalAlpha = alpha;

  // Core dot — bright yellow-green
  ctx.beginPath();
  ctx.arc(x, y, 4 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(180, 230, 50, 1)';
  ctx.fill();

  // Pulsing dashed ring
  const pulse = 1 + Math.sin(now / 150) * 0.3;
  const ringRadius = 8 * scale * pulse;
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180, 230, 50, 0.6)';
  ctx.lineWidth = 1.5 * scale;
  ctx.setLineDash([3 * scale, 3 * scale]);
  ctx.lineDashOffset = now / 80;
  ctx.stroke();
  ctx.setLineDash([]);

  // Muzzle flash — tiny cross/star every ~600ms
  const flashCycle = now % 600;
  if (flashCycle < 80) {
    const flashAlpha = 1 - flashCycle / 80;
    ctx.globalAlpha = alpha * flashAlpha;
    ctx.strokeStyle = 'rgba(255, 255, 200, 1)';
    ctx.lineWidth = 1.5 * scale;
    ctx.lineCap = 'round';
    const armLen = 5 * scale;
    // 4 arms: cross shape
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * armLen, y + Math.sin(angle) * armLen);
      ctx.stroke();
    }
  }

  ctx.restore();
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
  equipment?: Pick<FramePlayer, 'activeWeapon' | 'hasDefuser' | 'isScoped' | 'team'>,
) {
  const radius = 8 * scale;

  // Scoped indicator: dashed circle around player
  if (equipment?.isScoped) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 4 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([3 * scale, 3 * scale]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

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

  let bottomOffset = radius + 3 * scale;

  if (health < 100) {
    const barWidth = 20 * scale;
    const barHeight = 3 * scale;
    const barX = x - barWidth / 2;
    const barY = y + bottomOffset;

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = health > 50 ? '#4ade80' : health > 25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * (health / 100), barHeight);
    bottomOffset += barHeight + 2 * scale;
  }

  // Equipment: weapon abbreviation below health bar
  if (equipment?.activeWeapon) {
    const abbrev = weaponAbbrev(equipment.activeWeapon);
    ctx.font = `${8 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeText(abbrev, x, y + bottomOffset + 8 * scale);
    ctx.fillText(abbrev, x, y + bottomOffset + 8 * scale);
  }

  // Defuser indicator: "D" to the right of the player circle (CT only)
  if (equipment?.hasDefuser && equipment?.team === 'CT') {
    ctx.font = `bold ${8 * scale}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeText('D', x + radius + 2 * scale, y + 3 * scale);
    ctx.fillText('D', x + radius + 2 * scale, y + 3 * scale);
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

function drawKillMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  headshot: boolean,
) {
  const size = 5 * scale;

  ctx.save();
  ctx.strokeStyle = headshot ? '#ff4444' : '#cc3333';
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';

  // X shape
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();

  // Headshot: bright center dot
  if (headshot) {
    ctx.beginPath();
    ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6666';
    ctx.fill();
  }

  ctx.restore();
}

function drawDamageLine(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  vx: number,
  vy: number,
  alpha: number,
  dmgHealth: number,
  scale: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.6;
  ctx.strokeStyle = '#ef4444';
  // Thickness proportional to damage (1-4px scaled)
  ctx.lineWidth = Math.max(1, Math.min(4, dmgHealth / 25)) * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(vx, vy);
  ctx.stroke();
  ctx.restore();
}

function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  heatmap: HeatmapData,
) {
  const { grid, maxValue, gridSize } = heatmap;
  const cellSize = canvasSize / gridSize;

  ctx.save();
  ctx.globalAlpha = 0.55;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const value = grid[row][col];
      if (value === 0) continue;

      const intensity = value / maxValue;
      const color = heatmapColor(intensity);
      ctx.fillStyle = color;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize + 0.5, cellSize + 0.5);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function heatmapColor(t: number): string {
  // blue -> cyan -> green -> yellow -> red
  let r: number, g: number, b: number;
  if (t < 0.25) {
    const s = t / 0.25;
    r = 0; g = Math.round(s * 255); b = 255;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    r = 0; g = 255; b = Math.round((1 - s) * 255);
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    r = Math.round(s * 255); g = 255; b = 0;
  } else {
    const s = (t - 0.75) / 0.25;
    r = 255; g = Math.round((1 - s) * 255); b = 0;
  }
  return `rgba(${r},${g},${b},${Math.max(0.3, t)})`;
}

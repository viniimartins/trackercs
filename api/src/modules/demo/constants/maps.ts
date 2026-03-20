export interface MapConfig {
  name: string;
  pos_x: number;
  pos_y: number;
  scale: number;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
  de_dust2: {
    name: 'Dust 2',
    pos_x: -2476,
    pos_y: 3239,
    scale: 4.4,
  },
  de_mirage: {
    name: 'Mirage',
    pos_x: -3230,
    pos_y: 1713,
    scale: 5.0,
  },
  de_inferno: {
    name: 'Inferno',
    pos_x: -2087,
    pos_y: 3870,
    scale: 4.9,
  },
  de_nuke: {
    name: 'Nuke',
    pos_x: -3453,
    pos_y: 2887,
    scale: 7.0,
  },
  de_overpass: {
    name: 'Overpass',
    pos_x: -4831,
    pos_y: 1781,
    scale: 5.2,
  },
  de_ancient: {
    name: 'Ancient',
    pos_x: -2953,
    pos_y: 2164,
    scale: 5.0,
  },
  de_anubis: {
    name: 'Anubis',
    pos_x: -2796,
    pos_y: 3328,
    scale: 5.22,
  },
  de_vertigo: {
    name: 'Vertigo',
    pos_x: -3168,
    pos_y: 1762,
    scale: 4.0,
  },
};

export function gameToRadar(
  gameX: number,
  gameY: number,
  mapConfig: MapConfig,
  radarSize: number = 1024,
): { x: number; y: number } {
  const x = (gameX - mapConfig.pos_x) / mapConfig.scale;
  const y = (mapConfig.pos_y - gameY) / mapConfig.scale;
  return {
    x: Math.max(0, Math.min(radarSize, x)),
    y: Math.max(0, Math.min(radarSize, y)),
  };
}

export interface DemoPlayer {
  steamId: string;
  name: string;
  team: 'CT' | 'T';
}

export interface Demo {
  id: string;
  mapName: string;
  fileName: string;
  teamCT: string;
  teamT: string;
  scoreCT: number;
  scoreT: number;
  totalRounds: number;
  players: DemoPlayer[];
  tickRate: number;
  createdAt: string;
}

export interface DemoRound {
  roundNumber: number;
  startTick: number;
  endTick: number;
  winner?: 'ct_win' | 't_win';
  winReason?: string;
  scoreCT: number;
  scoreT: number;
  totalFrames: number;
  freezeEndTick?: number;
  roundTimeSeconds?: number;
}

export interface FramePlayer {
  steamId: string;
  name: string;
  team: 'CT' | 'T';
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  health: number;
  armor: number;
  isAlive: boolean;
  activeWeapon?: string;
  hasHelmet: boolean;
  hasDefuser: boolean;
  money: number;
  equipValue: number;
  ping: number;
  isScoped: boolean;
  isDefusing: boolean;
  isAirborne: boolean;
  flashDuration: number;
  killsTotal: number;
  deathsTotal: number;
  assistsTotal: number;
  score: number;
  mvps: number;
}

export interface Bomb {
  x: number;
  y: number;
  z: number;
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'exploded';
}

export interface DemoFrame {
  tick: number;
  frameIndex: number;
  players: FramePlayer[];
  bomb?: Bomb;
}

export interface KillEvent {
  tick: number;
  roundNumber: number;
  attackerSteamId: string;
  attackerName: string;
  victimSteamId: string;
  victimName: string;
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  noscope: boolean;
  thrusmoke: boolean;
  blindKill: boolean;
  assistedFlash: boolean;
  x: number;
  y: number;
  z: number;
}

export interface DamageEvent {
  tick: number;
  roundNumber: number;
  attackerSteamId: string;
  attackerName: string;
  victimSteamId: string;
  victimName: string;
  dmgHealth: number;
  dmgArmor: number;
  weapon: string;
  hitgroup: number;
}

export interface GrenadeEvent {
  tick: number;
  roundNumber: number;
  playerSteamId: string;
  playerName: string;
  grenadeType: 'flashbang' | 'hegrenade' | 'smokegrenade' | 'molotov' | 'decoy';
  x: number;
  y: number;
  z: number;
}

export interface BombEvent {
  tick: number;
  roundNumber: number;
  playerSteamId: string;
  playerName: string;
  action: 'planted' | 'defused' | 'exploded' | 'dropped' | 'pickup';
  x: number;
  y: number;
  z: number;
}

export type EventType = 'kills' | 'damage' | 'grenades' | 'bomb';

export interface PlayerStats {
  steamId: string;
  name: string;
  team: 'CT' | 'T';
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adr: number;
  hsPercent: number;
  firstKills: number;
  firstDeaths: number;
  utilityDamage: number;
  tradeKills: number;
  clutchesWon: number;
  clutchesTotal: number;
  kast: number;
  rating: number;
  openingDuelWinRate: number;
  multiKill2k: number;
  multiKill3k: number;
  multiKill4k: number;
  multiKill5k: number;
  flashAssists: number;
}

export type DemoEventMap = {
  kills: KillEvent[];
  damage: DamageEvent[];
  grenades: GrenadeEvent[];
  bomb: BombEvent[];
};

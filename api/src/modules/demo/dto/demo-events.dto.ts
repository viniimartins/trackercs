export class KillEventDto {
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

export class DamageEventDto {
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

export class GrenadeEventDto {
  tick: number;
  roundNumber: number;
  playerSteamId: string;
  playerName: string;
  grenadeType: 'flashbang' | 'hegrenade' | 'smokegrenade' | 'molotov' | 'decoy';
  x: number;
  y: number;
  z: number;
}

export class BombEventDto {
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

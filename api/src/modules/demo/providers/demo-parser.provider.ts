import {
  parseEvent,
  parseHeader,
  parseTicks,
} from '@laihoe/demoparser2';
import { Injectable, Logger } from '@nestjs/common';

import { MAP_CONFIGS } from '../constants/maps.js';
import type {
  BombEventDto,
  DamageEventDto,
  GrenadeEventDto,
  KillEventDto,
} from '../dto/demo-events.dto.js';
import type { BombDto,DemoFrameDto, FramePlayerDto } from '../dto/demo-frame.dto.js';
import type { DemoRoundDto } from '../dto/demo-round.dto.js';
import type { DemoSummaryDto, PlayerDto } from '../dto/demo-summary.dto.js';

const TICK_INTERVAL = 4;

function isZeroCoord(x: number, y: number, z: number): boolean {
  return x === 0 && y === 0 && z === 0;
}

function deriveWinnerFromReason(reason: string): 'ct_win' | 't_win' | undefined {
  switch (reason) {
    case 'bomb_defused':
    case 't_killed':
    case 'time_ran_out':
    case 'target_saved':
      return 'ct_win';
    case 'bomb_exploded':
    case 'ct_killed':
    case 'target_bombed':
      return 't_win';
    default:
      return undefined;
  }
}

interface RoundEvent {
  tick: number;
  [key: string]: unknown;
}

@Injectable()
export class DemoParserProvider {
  private readonly logger = new Logger(DemoParserProvider.name);

  parseHeader(buffer: Buffer): Record<string, string> {
    return parseHeader(buffer);
  }

  parseSummary(
    buffer: Buffer,
    demoId: string,
    fileName: string,
  ): DemoSummaryDto {
    const header = parseHeader(buffer);
    const mapName = header['map_name'] ?? 'unknown';

    const playerInfoFields = [
      'steamid',
      'name',
      'team_num',
    ];

    const players: PlayerDto[] = [];
    try {
      const lastTicks = parseTicks(buffer, playerInfoFields, []);
      const seen = new Set<string>();
      for (const row of lastTicks) {
        const steamId = String(row['steamid'] ?? '');
        if (!steamId || seen.has(steamId)) continue;
        seen.add(steamId);
        const teamNum = Number(row['team_num'] ?? 0);
        if (teamNum !== 2 && teamNum !== 3) continue;
        players.push({
          steamId,
          name: String(row['name'] ?? ''),
          team: teamNum === 3 ? 'CT' : 'T',
        });
      }
    } catch (e) {
      this.logger.warn('Failed to parse player info from ticks, using events fallback');
    }

    const rounds = this.parseRounds(buffer);
    const lastRound = rounds[rounds.length - 1];

    return {
      id: demoId,
      mapName,
      fileName,
      teamCT: players.filter((p) => p.team === 'CT')[0]?.name?.split(' ')[0] ?? 'CT',
      teamT: players.filter((p) => p.team === 'T')[0]?.name?.split(' ')[0] ?? 'T',
      scoreCT: lastRound?.scoreCT ?? 0,
      scoreT: lastRound?.scoreT ?? 0,
      totalRounds: rounds.length,
      players,
      tickRate: 64,
      createdAt: new Date().toISOString(),
    };
  }

  parseRounds(buffer: Buffer): DemoRoundDto[] {
    let roundStarts: RoundEvent[] = [];
    let roundEnds: RoundEvent[] = [];

    try {
      roundStarts = parseEvent(buffer, 'round_start') as RoundEvent[];
    } catch {
      this.logger.warn('No round_start events found');
    }
    try {
      roundEnds = parseEvent(buffer, 'round_end') as RoundEvent[];
    } catch {
      this.logger.warn('No round_end events found');
    }

    const rounds: DemoRoundDto[] = [];

    for (let i = 0; i < roundStarts.length; i++) {
      const start = roundStarts[i];
      const end = roundEnds[i];

      const startTick = Number(start?.tick ?? 0);
      const endTick = end ? Number(end.tick) : (roundStarts[i + 1] ? Number(roundStarts[i + 1].tick) - 1 : startTick + 10000);

      const winnerNum = end ? Number(end['winner'] ?? 0) : 0;
      const reason = end ? String(end['reason'] ?? '') : undefined;
      let winner: 'ct_win' | 't_win' | undefined =
        winnerNum === 3 ? 'ct_win' : winnerNum === 2 ? 't_win' : undefined;
      if (!winner && reason) {
        winner = deriveWinnerFromReason(reason);
      }

      const totalFrames = Math.floor((endTick - startTick) / TICK_INTERVAL);

      rounds.push({
        roundNumber: i + 1,
        startTick,
        endTick,
        winner,
        winReason: reason,
        scoreCT: 0,
        scoreT: 0,
        totalFrames: Math.max(totalFrames, 0),
      });
    }

    const filtered = rounds.filter((r) => !(r.startTick === 0 && r.endTick === 0));
    filtered.forEach((r, i) => { r.roundNumber = i + 1; });

    let ctScore = 0;
    let tScore = 0;
    for (const round of filtered) {
      if (round.winner === 'ct_win') ctScore++;
      else if (round.winner === 't_win') tScore++;
      round.scoreCT = ctScore;
      round.scoreT = tScore;
    }

    return filtered;
  }

  private buildBombStateForTick(
    bombEvents: BombEventDto[],
    tick: number,
    players: FramePlayerDto[],
  ): BombDto | undefined {
    const relevant = bombEvents.filter((e) => e.tick <= tick);
    if (relevant.length === 0) {
      const firstT = players.find((p) => p.team === 'T' && p.isAlive);
      if (firstT) {
        return { x: firstT.x, y: firstT.y, z: firstT.z, state: 'carried' };
      }
      return undefined;
    }

    const latest = relevant[relevant.length - 1];

    switch (latest.action) {
      case 'pickup': {
        const carrier = players.find(
          (p) => p.steamId === latest.playerSteamId && p.isAlive,
        );
        if (carrier) {
          return { x: carrier.x, y: carrier.y, z: carrier.z, state: 'carried' };
        }
        return { x: latest.x, y: latest.y, z: latest.z, state: 'carried' };
      }
      case 'dropped': {
        let { x, y, z } = latest;
        if (isZeroCoord(x, y, z)) {
          const dropper = players.find((p) => p.steamId === latest.playerSteamId);
          if (dropper) { x = dropper.x; y = dropper.y; z = dropper.z; }
        }
        return { x, y, z, state: 'dropped' };
      }
      case 'planted': {
        let { x, y, z } = latest;
        if (isZeroCoord(x, y, z)) {
          const planter = players.find((p) => p.steamId === latest.playerSteamId);
          if (planter) { x = planter.x; y = planter.y; z = planter.z; }
        }
        return { x, y, z, state: 'planted' };
      }
      case 'defused': {
        let { x, y, z } = latest;
        if (isZeroCoord(x, y, z)) {
          const planted = [...relevant].reverse().find((e) => e.action === 'planted');
          if (planted && !isZeroCoord(planted.x, planted.y, planted.z)) {
            x = planted.x; y = planted.y; z = planted.z;
          }
        }
        return { x, y, z, state: 'defused' };
      }
      case 'exploded': {
        let { x, y, z } = latest;
        if (isZeroCoord(x, y, z)) {
          const planted = [...relevant].reverse().find((e) => e.action === 'planted');
          if (planted && !isZeroCoord(planted.x, planted.y, planted.z)) {
            x = planted.x; y = planted.y; z = planted.z;
          }
        }
        return { x, y, z, state: 'exploded' };
      }
      default:
        return undefined;
    }
  }

  parseRoundFrames(
    buffer: Buffer,
    startTick: number,
    endTick: number,
    bombEvents: BombEventDto[] = [],
  ): DemoFrameDto[] {
    const tickList: number[] = [];
    for (let t = startTick; t <= endTick; t += TICK_INTERVAL) {
      tickList.push(t);
    }

    if (tickList.length === 0) return [];

    const fields = [
      'X',
      'Y',
      'Z',
      'pitch',
      'yaw',
      'health',
      'armor_value',
      'is_alive',
      'active_weapon_name',
      'has_helmet',
      'has_defuser',
      'in_buy_zone',
      'team_num',
      'steamid',
      'name',
      'balance',
      'current_equip_value',
      'ping',
      'is_scoped',
      'is_defusing',
      'is_airborne',
      'flash_duration',
      'kills_total',
      'deaths_total',
      'assists_total',
      'score',
      'mvps',
    ];

    let tickData: Record<string, unknown>[];
    try {
      tickData = parseTicks(buffer, fields, tickList);
    } catch (e) {
      this.logger.warn(`Failed to parse ticks ${startTick}-${endTick}: ${e}`);
      return [];
    }

    const frameMap = new Map<number, FramePlayerDto[]>();

    for (const row of tickData) {
      const tick = Number(row['tick'] ?? 0);
      const teamNum = Number(row['team_num'] ?? 0);
      if (teamNum !== 2 && teamNum !== 3) continue;

      if (!frameMap.has(tick)) {
        frameMap.set(tick, []);
      }

      const player: FramePlayerDto = {
        steamId: String(row['steamid'] ?? ''),
        name: String(row['name'] ?? ''),
        team: teamNum === 3 ? 'CT' : 'T',
        x: Number(row['X'] ?? 0),
        y: Number(row['Y'] ?? 0),
        z: Number(row['Z'] ?? 0),
        pitch: Number(row['pitch'] ?? 0),
        yaw: Number(row['yaw'] ?? 0),
        health: Number(row['health'] ?? 0),
        armor: Number(row['armor_value'] ?? 0),
        isAlive: Boolean(row['is_alive']),
        activeWeapon: row['active_weapon_name'] ? String(row['active_weapon_name']) : undefined,
        hasHelmet: Boolean(row['has_helmet']),
        hasDefuser: Boolean(row['has_defuser']),
        money: Number(row['balance'] ?? 0),
        equipValue: Number(row['current_equip_value'] ?? 0),
        ping: Number(row['ping'] ?? 0),
        isScoped: Boolean(row['is_scoped']),
        isDefusing: Boolean(row['is_defusing']),
        isAirborne: Boolean(row['is_airborne']),
        flashDuration: Number(row['flash_duration'] ?? 0),
        killsTotal: Number(row['kills_total'] ?? 0),
        deathsTotal: Number(row['deaths_total'] ?? 0),
        assistsTotal: Number(row['assists_total'] ?? 0),
        score: Number(row['score'] ?? 0),
        mvps: Number(row['mvps'] ?? 0),
      };

      frameMap.get(tick)!.push(player);
    }

    const sortedTicks = [...frameMap.keys()].sort((a, b) => a - b);

    return sortedTicks.map((tick, index) => {
      const players = frameMap.get(tick) ?? [];
      return {
        tick,
        frameIndex: index,
        players,
        bomb: this.buildBombStateForTick(bombEvents, tick, players),
      };
    });
  }

  private resolveRoundNumber(
    tick: number,
    rounds: DemoRoundDto[],
  ): number {
    for (const r of rounds) {
      if (tick >= r.startTick && tick <= r.endTick) return r.roundNumber;
    }
    return 0;
  }

  parseKillEvents(buffer: Buffer, rounds: DemoRoundDto[]): KillEventDto[] {
    let events: RoundEvent[] = [];
    try {
      events = parseEvent(buffer, 'player_death') as RoundEvent[];
    } catch {
      this.logger.warn('No player_death events found');
      return [];
    }

    return events.map((e) => ({
      tick: Number(e['tick'] ?? 0),
      roundNumber: this.resolveRoundNumber(Number(e['tick'] ?? 0), rounds),
      attackerSteamId: String(e['attacker_steamid'] ?? e['attacker'] ?? ''),
      attackerName: String(e['attacker_name'] ?? ''),
      victimSteamId: String(e['user_steamid'] ?? e['steamid'] ?? ''),
      victimName: String(e['user_name'] ?? e['name'] ?? ''),
      weapon: String(e['weapon'] ?? ''),
      headshot: Boolean(e['headshot']),
      wallbang: Number(e['penetrated'] ?? 0) > 0,
      noscope: Boolean(e['noscope']),
      thrusmoke: Boolean(e['thrusmoke']),
      blindKill: Boolean(e['attackerblind']),
      assistedFlash: Boolean(e['assistedflash']),
      x: Number(e['x'] ?? 0),
      y: Number(e['y'] ?? 0),
      z: Number(e['z'] ?? 0),
    }));
  }

  parseDamageEvents(buffer: Buffer, rounds: DemoRoundDto[]): DamageEventDto[] {
    let events: RoundEvent[] = [];
    try {
      events = parseEvent(buffer, 'player_hurt') as RoundEvent[];
    } catch {
      this.logger.warn('No player_hurt events found');
      return [];
    }

    return events.map((e) => ({
      tick: Number(e['tick'] ?? 0),
      roundNumber: this.resolveRoundNumber(Number(e['tick'] ?? 0), rounds),
      attackerSteamId: String(e['attacker_steamid'] ?? e['attacker'] ?? ''),
      attackerName: String(e['attacker_name'] ?? ''),
      victimSteamId: String(e['user_steamid'] ?? e['steamid'] ?? ''),
      victimName: String(e['user_name'] ?? e['name'] ?? ''),
      dmgHealth: Number(e['dmg_health'] ?? 0),
      dmgArmor: Number(e['dmg_armor'] ?? 0),
      weapon: String(e['weapon'] ?? ''),
      hitgroup: Number(e['hitgroup'] ?? 0),
    }));
  }

  parseGrenadeEvents(buffer: Buffer, rounds: DemoRoundDto[]): GrenadeEventDto[] {
    const grenadeEventNames = [
      { event: 'flashbang_detonate', type: 'flashbang' as const },
      { event: 'hegrenade_detonate', type: 'hegrenade' as const },
      { event: 'smokegrenade_detonate', type: 'smokegrenade' as const },
      { event: 'inferno_startburn', type: 'molotov' as const },
      { event: 'decoy_started', type: 'decoy' as const },
    ];

    const allEvents: GrenadeEventDto[] = [];

    for (const { event, type } of grenadeEventNames) {
      try {
        const events = parseEvent(buffer, event) as RoundEvent[];
        for (const e of events) {
          allEvents.push({
            tick: Number(e['tick'] ?? 0),
            roundNumber: this.resolveRoundNumber(Number(e['tick'] ?? 0), rounds),
            playerSteamId: String(e['user_steamid'] ?? e['steamid'] ?? ''),
            playerName: String(e['user_name'] ?? e['name'] ?? ''),
            grenadeType: type,
            x: Number(e['x'] ?? 0),
            y: Number(e['y'] ?? 0),
            z: Number(e['z'] ?? 0),
          });
        }
      } catch {
        this.logger.warn(`No ${event} events found`);
      }
    }

    return allEvents.sort((a, b) => a.tick - b.tick);
  }

  parseBombEvents(buffer: Buffer, rounds: DemoRoundDto[]): BombEventDto[] {
    const bombEventNames = [
      { event: 'bomb_planted', action: 'planted' as const },
      { event: 'bomb_defused', action: 'defused' as const },
      { event: 'bomb_exploded', action: 'exploded' as const },
      { event: 'bomb_dropped', action: 'dropped' as const },
      { event: 'bomb_pickup', action: 'pickup' as const },
    ];

    const allEvents: BombEventDto[] = [];

    for (const { event, action } of bombEventNames) {
      try {
        const events = parseEvent(buffer, event) as RoundEvent[];
        for (const e of events) {
          allEvents.push({
            tick: Number(e['tick'] ?? 0),
            roundNumber: this.resolveRoundNumber(Number(e['tick'] ?? 0), rounds),
            playerSteamId: String(e['user_steamid'] ?? e['steamid'] ?? ''),
            playerName: String(e['user_name'] ?? e['name'] ?? ''),
            action,
            x: Number(e['x'] ?? 0),
            y: Number(e['y'] ?? 0),
            z: Number(e['z'] ?? 0),
          });
        }
      } catch {
        this.logger.warn(`No ${event} events found`);
      }
    }

    return allEvents.sort((a, b) => a.tick - b.tick);
  }
}

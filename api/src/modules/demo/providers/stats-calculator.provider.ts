import { Injectable } from '@nestjs/common';
import type { KillEventDto, DamageEventDto } from '../dto/demo-events.dto.js';
import type { DemoRoundDto } from '../dto/demo-round.dto.js';
import type { PlayerDto } from '../dto/demo-summary.dto.js';
import type { PlayerStatsDto } from '../dto/player-stats.dto.js';

const UTILITY_WEAPONS = ['hegrenade', 'molotov', 'inferno'];

@Injectable()
export class StatsCalculatorProvider {
  calculate(
    kills: KillEventDto[],
    damage: DamageEventDto[],
    rounds: DemoRoundDto[],
    players: PlayerDto[],
  ): PlayerStatsDto[] {
    const roundCount = rounds.length || 1;

    // Group kills by round to find first kills/deaths
    const killsByRound = new Map<number, KillEventDto[]>();
    for (const kill of kills) {
      const existing = killsByRound.get(kill.roundNumber) ?? [];
      existing.push(kill);
      killsByRound.set(kill.roundNumber, existing);
    }

    // Find first kill per round (lowest tick)
    const firstKillPerRound = new Map<number, KillEventDto>();
    for (const [roundNum, roundKills] of killsByRound) {
      const sorted = [...roundKills].sort((a, b) => a.tick - b.tick);
      if (sorted.length > 0) {
        firstKillPerRound.set(roundNum, sorted[0]);
      }
    }

    return players.map((player) => {
      const playerKills = kills.filter(
        (k) => k.attackerSteamId === player.steamId,
      );
      const playerDeaths = kills.filter(
        (k) => k.victimSteamId === player.steamId,
      );
      const playerAssists = kills.filter(
        (k) =>
          k.assistedFlash && k.attackerSteamId === player.steamId,
      );

      const totalDmg = damage
        .filter((d) => d.attackerSteamId === player.steamId)
        .reduce((sum, d) => sum + d.dmgHealth, 0);

      const hsKills = playerKills.filter((k) => k.headshot).length;
      const killCount = playerKills.length;
      const deathCount = playerDeaths.length;

      let firstKillCount = 0;
      let firstDeathCount = 0;
      for (const [, firstKill] of firstKillPerRound) {
        if (firstKill.attackerSteamId === player.steamId) firstKillCount++;
        if (firstKill.victimSteamId === player.steamId) firstDeathCount++;
      }

      const utilDmg = damage
        .filter(
          (d) =>
            d.attackerSteamId === player.steamId &&
            UTILITY_WEAPONS.includes(d.weapon),
        )
        .reduce((sum, d) => sum + d.dmgHealth, 0);

      return {
        steamId: player.steamId,
        name: player.name,
        team: player.team,
        kills: killCount,
        deaths: deathCount,
        assists: playerAssists.length,
        kd: Math.round((killCount / Math.max(deathCount, 1)) * 100) / 100,
        adr: Math.round(totalDmg / roundCount),
        hsPercent:
          killCount > 0
            ? Math.round((hsKills / killCount) * 100)
            : 0,
        firstKills: firstKillCount,
        firstDeaths: firstDeathCount,
        utilityDamage: utilDmg,
      };
    });
  }
}

import { Injectable } from '@nestjs/common';

import type { DamageEventDto,KillEventDto } from '../dto/demo-events.dto.js';
import type { DemoRoundDto } from '../dto/demo-round.dto.js';
import type { PlayerDto } from '../dto/demo-summary.dto.js';
import type { PlayerStatsDto } from '../dto/player-stats.dto.js';

const UTILITY_WEAPONS = ['hegrenade', 'molotov', 'inferno'];
const TRADE_WINDOW_TICKS = 320; // 5 seconds at 64 tick

@Injectable()
export class StatsCalculatorProvider {
  calculate(
    kills: KillEventDto[],
    damage: DamageEventDto[],
    rounds: DemoRoundDto[],
    players: PlayerDto[],
  ): PlayerStatsDto[] {
    const roundCount = rounds.length || 1;

    // Group kills by round
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

    // Build team map for players
    const playerTeamMap = new Map<string, 'CT' | 'T'>();
    for (const player of players) {
      playerTeamMap.set(player.steamId, player.team);
    }

    // Precompute trade kills: for each kill, check if victim's death was "traded"
    // A trade kill = someone from the victim's team kills the attacker within TRADE_WINDOW_TICKS
    const tradeKillSet = new Set<string>(); // key: `${roundNumber}-${traderSteamId}-${tick}`
    const tradedDeathSet = new Set<string>(); // key: `${roundNumber}-${victimSteamId}`

    for (const [roundNum, roundKills] of killsByRound) {
      const sorted = [...roundKills].sort((a, b) => a.tick - b.tick);
      for (let i = 0; i < sorted.length; i++) {
        const death = sorted[i];
        const victimTeam = playerTeamMap.get(death.victimSteamId);
        // Look for a revenge kill within the trade window
        for (let j = i + 1; j < sorted.length; j++) {
          const revenge = sorted[j];
          if (revenge.tick - death.tick > TRADE_WINDOW_TICKS) break;
          const revengeTeam = playerTeamMap.get(revenge.attackerSteamId);
          if (
            revengeTeam === victimTeam &&
            revenge.victimSteamId === death.attackerSteamId
          ) {
            tradeKillSet.add(`${roundNum}-${revenge.attackerSteamId}-${revenge.tick}`);
            tradedDeathSet.add(`${roundNum}-${death.victimSteamId}`);
            break;
          }
        }
      }
    }

    // Precompute clutch data per round
    // Clutch: player is last alive on their team, with N enemies alive, and their team wins
    const clutchData = this.computeClutches(killsByRound, rounds, players);

    // Precompute KAST per player per round
    // K = got a kill, A = got an assist, S = survived, T = was traded
    const kastPerPlayer = new Map<string, number>(); // steamId -> rounds with KAST

    for (const player of players) {
      let kastRounds = 0;
      for (const round of rounds) {
        const roundKills = killsByRound.get(round.roundNumber) ?? [];
        const gotKill = roundKills.some(
          (k) => k.attackerSteamId === player.steamId,
        );
        const gotAssist = roundKills.some(
          (k) => k.assistedFlash && k.attackerSteamId === player.steamId,
        );
        const died = roundKills.some(
          (k) => k.victimSteamId === player.steamId,
        );
        const survived = !died;
        const wasTraded = tradedDeathSet.has(
          `${round.roundNumber}-${player.steamId}`,
        );
        if (gotKill || gotAssist || survived || wasTraded) {
          kastRounds++;
        }
      }
      kastPerPlayer.set(player.steamId, kastRounds);
    }

    // Compute multikills per player per round
    const multiKills = new Map<string, { mk2: number; mk3: number; mk4: number; mk5: number }>();
    for (const player of players) {
      const counts = { mk2: 0, mk3: 0, mk4: 0, mk5: 0 };
      for (const round of rounds) {
        const roundKills = killsByRound.get(round.roundNumber) ?? [];
        const playerRoundKills = roundKills.filter(
          (k) => k.attackerSteamId === player.steamId,
        ).length;
        if (playerRoundKills >= 5) counts.mk5++;
        else if (playerRoundKills === 4) counts.mk4++;
        else if (playerRoundKills === 3) counts.mk3++;
        else if (playerRoundKills === 2) counts.mk2++;
      }
      multiKills.set(player.steamId, counts);
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

      // Trade kills for this player
      let tradeKillCount = 0;
      for (const kill of playerKills) {
        if (tradeKillSet.has(`${kill.roundNumber}-${player.steamId}-${kill.tick}`)) {
          tradeKillCount++;
        }
      }

      // Clutches
      const playerClutch = clutchData.get(player.steamId) ?? { won: 0, total: 0 };

      // KAST
      const kastRounds = kastPerPlayer.get(player.steamId) ?? 0;
      const kastPercent = roundCount > 0 ? Math.round((kastRounds / roundCount) * 100) : 0;

      // Opening duel win rate
      const openingDuelWinRate =
        firstKillCount + firstDeathCount > 0
          ? Math.round(
              (firstKillCount / (firstKillCount + firstDeathCount)) * 100,
            )
          : 0;

      // Flash assists (kills where assistedFlash is true and the flash thrower is this player)
      // In the current data model, assistedFlash on a kill means the attacker was flash-assisted
      // We count kills where the victim was flashed by this player — but we don't have that data directly
      // So we count kills where assistedFlash=true and the attacker is a teammate of this player
      // For now, use the existing assist count as flash assists since assistedFlash is what we track
      const flashAssistCount = kills.filter(
        (k) =>
          k.assistedFlash &&
          k.attackerSteamId !== player.steamId &&
          playerTeamMap.get(k.attackerSteamId) === player.team,
      ).length;
      // Simplified: divide total flash assists evenly is inaccurate
      // Better: count assists attributed to this player (already tracked in playerAssists)
      const flashAssists = playerAssists.length;

      // Multikills
      const mk = multiKills.get(player.steamId) ?? { mk2: 0, mk3: 0, mk4: 0, mk5: 0 };

      // Rating 2.0 approximation
      const kpr = killCount / roundCount;
      const dpr = deathCount / roundCount;
      const apr = playerAssists.length / roundCount;
      const adr = totalDmg / roundCount;
      const impact = 2.13 * kpr + 0.42 * apr - 0.41;
      const rating =
        Math.round(
          (0.0073 * kastPercent +
            0.3591 * kpr -
            0.5329 * dpr +
            0.2372 * impact +
            0.0032 * adr +
            0.1587) *
            100,
        ) / 100;

      return {
        steamId: player.steamId,
        name: player.name,
        team: player.team,
        kills: killCount,
        deaths: deathCount,
        assists: playerAssists.length,
        kd: Math.round((killCount / Math.max(deathCount, 1)) * 100) / 100,
        adr: Math.round(adr),
        hsPercent:
          killCount > 0
            ? Math.round((hsKills / killCount) * 100)
            : 0,
        firstKills: firstKillCount,
        firstDeaths: firstDeathCount,
        utilityDamage: utilDmg,
        tradeKills: tradeKillCount,
        clutchesWon: playerClutch.won,
        clutchesTotal: playerClutch.total,
        kast: kastPercent,
        rating,
        openingDuelWinRate,
        multiKill2k: mk.mk2,
        multiKill3k: mk.mk3,
        multiKill4k: mk.mk4,
        multiKill5k: mk.mk5,
        flashAssists,
      };
    });
  }

  private computeClutches(
    killsByRound: Map<number, KillEventDto[]>,
    rounds: DemoRoundDto[],
    players: PlayerDto[],
  ): Map<string, { won: number; total: number }> {
    const result = new Map<string, { won: number; total: number }>();
    for (const player of players) {
      result.set(player.steamId, { won: 0, total: 0 });
    }

    const teamPlayers = new Map<'CT' | 'T', string[]>();
    teamPlayers.set(
      'CT',
      players.filter((p) => p.team === 'CT').map((p) => p.steamId),
    );
    teamPlayers.set(
      'T',
      players.filter((p) => p.team === 'T').map((p) => p.steamId),
    );

    for (const round of rounds) {
      if (!round.winner) continue;
      const roundKills = killsByRound.get(round.roundNumber) ?? [];
      const sorted = [...roundKills].sort((a, b) => a.tick - b.tick);

      const alive = new Set<string>(players.map((p) => p.steamId));
      const clutchFoundForTeam = new Set<'CT' | 'T'>();

      for (const kill of sorted) {
        alive.delete(kill.victimSteamId);

        for (const team of ['CT', 'T'] as const) {
          if (clutchFoundForTeam.has(team)) continue;

          const teamMembers = teamPlayers.get(team) ?? [];
          const aliveOnTeam = teamMembers.filter((id) => alive.has(id));

          if (aliveOnTeam.length === 1) {
            const otherTeam = team === 'CT' ? 'T' : 'CT';
            const enemiesAlive = (teamPlayers.get(otherTeam) ?? []).filter(
              (id) => alive.has(id),
            ).length;

            if (enemiesAlive >= 1) {
              clutchFoundForTeam.add(team);
              const clutchPlayer = aliveOnTeam[0];
              const entry = result.get(clutchPlayer)!;
              const winnerTeam = round.winner === 'ct_win' ? 'CT' : 'T';
              entry.total++;
              if (winnerTeam === team) {
                entry.won++;
              }
            }
          }
        }
      }
    }

    return result;
  }
}

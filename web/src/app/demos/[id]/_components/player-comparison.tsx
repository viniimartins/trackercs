'use client';

import { useState, useMemo } from 'react';
import type { PlayerStats } from '@/modules/demo/model';

interface PlayerComparisonProps {
  stats: PlayerStats[];
}

type CompareKey = keyof Pick<
  PlayerStats,
  | 'kills' | 'deaths' | 'assists' | 'kd' | 'adr' | 'hsPercent'
  | 'rating' | 'kast' | 'tradeKills' | 'clutchesWon'
  | 'firstKills' | 'firstDeaths' | 'openingDuelWinRate'
  | 'utilityDamage' | 'flashAssists'
  | 'multiKill2k' | 'multiKill3k' | 'multiKill4k' | 'multiKill5k'
>;

const COMPARE_ROWS: { key: CompareKey; label: string; format?: (v: number) => string; inverse?: boolean }[] = [
  { key: 'rating', label: 'Rating', format: (v) => v.toFixed(2) },
  { key: 'kast', label: 'KAST%', format: (v) => `${v}%` },
  { key: 'kills', label: 'Kills' },
  { key: 'deaths', label: 'Deaths', inverse: true },
  { key: 'assists', label: 'Assists' },
  { key: 'kd', label: 'K/D', format: (v) => v.toFixed(2) },
  { key: 'adr', label: 'ADR', format: (v) => v.toFixed(1) },
  { key: 'hsPercent', label: 'HS%', format: (v) => `${v}%` },
  { key: 'firstKills', label: 'FK' },
  { key: 'firstDeaths', label: 'FD', inverse: true },
  { key: 'openingDuelWinRate', label: 'OD%', format: (v) => `${v}%` },
  { key: 'tradeKills', label: 'Trade' },
  { key: 'clutchesWon', label: 'Clutch' },
  { key: 'flashAssists', label: 'Flash' },
  { key: 'utilityDamage', label: 'Util Dmg' },
  { key: 'multiKill2k', label: '2K' },
  { key: 'multiKill3k', label: '3K' },
  { key: 'multiKill4k', label: '4K' },
  { key: 'multiKill5k', label: '5K' },
];

export function PlayerComparison({ stats }: PlayerComparisonProps) {
  const [playerA, setPlayerA] = useState<string>(stats[0]?.steamId ?? '');
  const [playerB, setPlayerB] = useState<string>(stats[1]?.steamId ?? '');

  const a = useMemo(() => stats.find((s) => s.steamId === playerA), [stats, playerA]);
  const b = useMemo(() => stats.find((s) => s.steamId === playerB), [stats, playerB]);

  return (
    <div className="p-3">
      {/* Player selectors — stacked */}
      <div className="flex flex-col gap-2 mb-3">
        <select
          value={playerA}
          onChange={(e) => setPlayerA(e.target.value)}
          className="w-full bg-transparent text-foreground rounded px-2 py-1.5 text-xs border border-border/50 hover:border-border"
        >
          {stats.map((s) => (
            <option key={s.steamId} value={s.steamId}>
              {s.name} ({s.team})
            </option>
          ))}
        </select>
        <select
          value={playerB}
          onChange={(e) => setPlayerB(e.target.value)}
          className="w-full bg-transparent text-foreground rounded px-2 py-1.5 text-xs border border-border/50 hover:border-border"
        >
          {stats.map((s) => (
            <option key={s.steamId} value={s.steamId}>
              {s.name} ({s.team})
            </option>
          ))}
        </select>
      </div>

      {a && b && (
        <div className="space-y-0.5">
          {COMPARE_ROWS.map((row) => {
            const valA = a[row.key];
            const valB = b[row.key];
            const fmtA = row.format ? row.format(valA) : String(valA);
            const fmtB = row.format ? row.format(valB) : String(valB);
            const total = Math.abs(valA) + Math.abs(valB) || 1;
            const pctA = (Math.abs(valA) / total) * 100;
            const aWins = row.inverse ? valA < valB : valA > valB;
            const bWins = row.inverse ? valB < valA : valB > valA;

            return (
              <div
                key={row.key}
                className="grid grid-cols-[1fr_auto_1fr] gap-1 items-center px-1 py-0.5"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-xs tabular-nums ${aWins ? 'text-green-400 font-bold' : 'text-muted-foreground'}`}>
                    {fmtA}
                  </span>
                  <div className="w-14 h-1.5 bg-muted/30 rounded-full overflow-hidden flex justify-end">
                    <div
                      className={`h-full rounded-full ${aWins ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${pctA}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground w-14 text-center">
                  {row.label}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-14 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bWins ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
                      style={{ width: `${100 - pctA}%` }}
                    />
                  </div>
                  <span className={`text-xs tabular-nums ${bWins ? 'text-green-400 font-bold' : 'text-muted-foreground'}`}>
                    {fmtB}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

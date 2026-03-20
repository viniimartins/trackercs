'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { PlayerStats } from '@/modules/demo/model';

type NumericStatsKey = {
  [K in keyof PlayerStats]: PlayerStats[K] extends number ? K : never;
}[keyof PlayerStats];

interface Column {
  key: NumericStatsKey;
  label: string;
  format?: (v: number) => string;
}

const OVERVIEW_COLUMNS: Column[] = [
  { key: 'kills', label: 'K' },
  { key: 'deaths', label: 'D' },
  { key: 'assists', label: 'A' },
  { key: 'kd', label: 'K/D', format: (v) => v.toFixed(2) },
  { key: 'adr', label: 'ADR', format: (v) => v.toFixed(1) },
  { key: 'hsPercent', label: 'HS%', format: (v) => `${v}%` },
  { key: 'rating', label: 'Rating', format: (v) => v.toFixed(2) },
];

const ADVANCED_COLUMNS: Column[] = [
  { key: 'kast', label: 'KAST%', format: (v) => `${v}%` },
  { key: 'tradeKills', label: 'TK' },
  { key: 'clutchesWon', label: 'CL' },
  { key: 'openingDuelWinRate', label: 'OD%', format: (v) => `${v}%` },
  { key: 'firstKills', label: 'FK' },
  { key: 'firstDeaths', label: 'FD' },
  { key: 'utilityDamage', label: 'UD' },
  { key: 'flashAssists', label: 'FA' },
  { key: 'multiKill2k', label: '2K' },
  { key: 'multiKill3k', label: '3K' },
  { key: 'multiKill4k', label: '4K' },
  { key: 'multiKill5k', label: '5K' },
];

interface StatsTableProps {
  stats: PlayerStats[];
}

export function StatsTable({ stats }: StatsTableProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mx-3 mt-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <StatsInlineTable stats={stats} columns={OVERVIEW_COLUMNS} />
      </TabsContent>
      <TabsContent value="advanced">
        <StatsInlineTable stats={stats} columns={ADVANCED_COLUMNS} />
      </TabsContent>
    </Tabs>
  );
}

function StatsInlineTable({ stats, columns }: { stats: PlayerStats[]; columns: Column[] }) {
  const [sortKey, setSortKey] = useState<NumericStatsKey>(columns[0].key);
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: NumericStatsKey) => {
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const invertedKeys = new Set<NumericStatsKey>(['deaths', 'firstDeaths']);

  const ctPlayers = useMemo(
    () =>
      stats
        .filter((p) => p.team === 'CT')
        .sort((a, b) =>
          sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey],
        ),
    [stats, sortKey, sortDesc],
  );

  const tPlayers = useMemo(
    () =>
      stats
        .filter((p) => p.team === 'T')
        .sort((a, b) =>
          sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey],
        ),
    [stats, sortKey, sortDesc],
  );

  const bestInTeam = useMemo(() => {
    const best: Record<string, Record<string, number>> = { CT: {}, T: {} };
    for (const col of columns) {
      if (invertedKeys.has(col.key)) continue;
      const ctMax = Math.max(...ctPlayers.map((p) => p[col.key]), -Infinity);
      const tMax = Math.max(...tPlayers.map((p) => p[col.key]), -Infinity);
      best.CT[col.key] = ctMax;
      best.T[col.key] = tMax;
    }
    return best;
  }, [ctPlayers, tPlayers, columns]);

  const isBestKey = (player: PlayerStats, key: NumericStatsKey) =>
    !invertedKeys.has(key) && player[key] === bestInTeam[player.team]?.[key] && player[key] > 0;

  const headerRow = (
    <div className="flex items-center gap-0 px-2 py-1">
      <span className="text-[9px] uppercase text-muted-foreground w-20 shrink-0 truncate" />
      {columns.map((col) => (
        <button
          key={col.key}
          onClick={() => handleSort(col.key)}
          className={cn(
            'text-[9px] uppercase text-right flex-1 min-w-0 px-0.5',
            sortKey === col.key
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground/70',
          )}
        >
          {col.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* CT team */}
      <div>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
            Counter-Terrorists
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        {headerRow}
        <div className="flex flex-col">
          {ctPlayers.map((player) => (
            <PlayerRow
              key={player.steamId}
              player={player}
              columns={columns}
              isBest={isBestKey}
              sortKey={sortKey}
            />
          ))}
        </div>
      </div>

      {/* T team */}
      <div>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="text-[10px] text-yellow-400 uppercase tracking-wider font-semibold">
            Terrorists
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        {headerRow}
        <div className="flex flex-col">
          {tPlayers.map((player) => (
            <PlayerRow
              key={player.steamId}
              player={player}
              columns={columns}
              isBest={isBestKey}
              sortKey={sortKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  columns,
  isBest,
  sortKey,
}: {
  player: PlayerStats;
  columns: Column[];
  isBest: (player: PlayerStats, key: NumericStatsKey) => boolean;
  sortKey: NumericStatsKey;
}) {
  return (
    <div className="flex items-center gap-0 px-2 py-1 rounded hover:bg-muted/40">
      <span className="text-xs font-bold w-20 shrink-0 truncate">{player.name}</span>
      {columns.map((col) => {
        const value = player[col.key];
        const formatted = col.format ? col.format(value) : String(value);
        const best = isBest(player, col.key);

        return (
          <span
            key={col.key}
            className={cn(
              'text-[10px] tabular-nums text-right flex-1 min-w-0 px-0.5',
              best
                ? 'text-foreground font-bold'
                : sortKey === col.key
                  ? 'text-foreground/80 font-medium'
                  : 'text-muted-foreground',
            )}
          >
            {formatted}
          </span>
        );
      })}
    </div>
  );
}

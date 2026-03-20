'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
        <StatsCards stats={stats} columns={OVERVIEW_COLUMNS} />
      </TabsContent>
      <TabsContent value="advanced">
        <StatsCards stats={stats} columns={ADVANCED_COLUMNS} />
      </TabsContent>
    </Tabs>
  );
}

function StatsCards({ stats, columns }: { stats: PlayerStats[]; columns: Column[] }) {
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

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Sort labels */}
      <div className="flex flex-wrap gap-1 px-1">
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`text-[9px] uppercase px-1.5 py-0.5 rounded transition-colors ${
              sortKey === col.key
                ? 'text-primary bg-primary/10 font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* CT team */}
      <div>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
            Counter-Terrorists
          </span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <div className="p-1.5 space-y-1">
          {ctPlayers.map((player) => (
            <PlayerStatCard
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
        <div className="p-1.5 space-y-1">
          {tPlayers.map((player) => (
            <PlayerStatCard
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

function PlayerStatCard({
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
    <div className="rounded px-2 py-1.5 hover:bg-muted/40 transition-colors">
      <p className="text-xs font-bold mb-1 truncate">{player.name}</p>
      <div className="grid grid-cols-4 gap-x-2 gap-y-0.5">
        {columns.map((col) => {
          const value = player[col.key];
          const formatted = col.format ? col.format(value) : String(value);
          const best = isBest(player, col.key);

          return (
            <div key={col.key}>
              <p className={`text-[9px] uppercase leading-tight ${
                sortKey === col.key ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}>
                {col.label}
              </p>
              <p className={`text-xs tabular-nums ${
                best ? 'text-primary font-bold' : 'font-semibold'
              }`}>
                {formatted}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

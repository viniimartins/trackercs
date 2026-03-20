'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

function getBarWidth(value: number, max: number) {
  if (max === 0) return 0;
  return (value / max) * 100;
}

export function StatsTable({ stats }: StatsTableProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mx-3 mt-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <StatsTableInner stats={stats} columns={OVERVIEW_COLUMNS} />
      </TabsContent>
      <TabsContent value="advanced">
        <StatsTableInner stats={stats} columns={ADVANCED_COLUMNS} />
      </TabsContent>
    </Tabs>
  );
}

function StatsTableInner({ stats, columns }: { stats: PlayerStats[]; columns: Column[] }) {
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

  const maxValues = useMemo(() => {
    const max: Partial<Record<NumericStatsKey, number>> = {};
    for (const col of columns) {
      max[col.key] = Math.max(...stats.map((p) => p[col.key]), 1);
    }
    return max;
  }, [stats, columns]);

  const bestInTeam = useMemo(() => {
    const best: Record<string, Record<string, number>> = { CT: {}, T: {} };
    const invertedKeys = new Set<NumericStatsKey>(['deaths', 'firstDeaths']);
    for (const col of columns) {
      if (invertedKeys.has(col.key)) continue;
      const ctMax = Math.max(...ctPlayers.map((p) => p[col.key]), -Infinity);
      const tMax = Math.max(...tPlayers.map((p) => p[col.key]), -Infinity);
      best.CT[col.key] = ctMax;
      best.T[col.key] = tMax;
    }
    return best;
  }, [ctPlayers, tPlayers, columns]);

  const invertedKeys = new Set<NumericStatsKey>(['deaths', 'firstDeaths']);

  const headerRow = (
    <TableRow className="border-b-border/50 hover:bg-transparent">
      <TableHead className="w-[140px] text-xs">Player</TableHead>
      {columns.map((col) => (
        <TableHead
          key={col.key}
          className="text-center text-xs cursor-pointer hover:text-foreground transition-colors"
          onClick={() => handleSort(col.key)}
        >
          <span className="inline-flex items-center gap-1">
            {col.label}
            <ArrowUpDown className={`size-3 ${sortKey === col.key ? 'text-primary' : 'text-muted-foreground/50'}`} />
          </span>
        </TableHead>
      ))}
    </TableRow>
  );

  const renderRow = (player: PlayerStats, teamColor: string, team: string) => {
    const isBestKey = (key: NumericStatsKey) =>
      !invertedKeys.has(key) && player[key] === bestInTeam[team]?.[key] && player[key] > 0;

    return (
      <TableRow key={player.steamId} className="border-b-border/30">
        <TableCell>
          <span className="text-xs font-medium">{player.name}</span>
        </TableCell>
        {columns.map((col) => {
          const value = player[col.key];
          const formatted = col.format ? col.format(value) : String(value);
          const barW = getBarWidth(value, maxValues[col.key] ?? 1);
          const isHighlight = col.key === 'kd' || col.key === 'adr' || col.key === 'rating';
          const isBest = isBestKey(col.key);

          return (
            <TableCell key={col.key} className="text-center">
              <div className="relative flex items-center justify-center">
                {isHighlight && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-sm opacity-15"
                    style={{
                      width: `${barW}%`,
                      backgroundColor: teamColor,
                    }}
                  />
                )}
                <span className={`relative text-xs tabular-nums ${
                  isBest ? 'text-primary font-bold' :
                  sortKey === col.key ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}>
                  {formatted}
                </span>
              </div>
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  return (
    <div className="flex flex-col gap-3 p-3 overflow-auto">
      <div className="rounded-lg overflow-hidden ring-1 ring-blue-500/20 bg-card/50">
        <div className="bg-blue-950/40 px-3 py-1.5 flex items-center gap-2">
          <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[10px] uppercase tracking-wider">
            Counter-Terrorists
          </Badge>
        </div>
        <Table>
          <TableHeader>{headerRow}</TableHeader>
          <TableBody>{ctPlayers.map((p) => renderRow(p, '#3b82f6', 'CT'))}</TableBody>
        </Table>
      </div>

      <div className="rounded-lg overflow-hidden ring-1 ring-yellow-500/20 bg-card/50">
        <div className="bg-yellow-950/40 px-3 py-1.5 flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-[10px] uppercase tracking-wider">
            Terrorists
          </Badge>
        </div>
        <Table>
          <TableHeader>{headerRow}</TableHeader>
          <TableBody>{tPlayers.map((p) => renderRow(p, '#eab308', 'T'))}</TableBody>
        </Table>
      </div>
    </div>
  );
}

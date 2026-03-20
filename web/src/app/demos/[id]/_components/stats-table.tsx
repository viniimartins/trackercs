'use client';

import { useState, useMemo } from 'react';
import type { PlayerStats } from '@/modules/demo/model';

type SortKey = keyof Pick<
  PlayerStats,
  'kills' | 'deaths' | 'assists' | 'kd' | 'adr' | 'hsPercent' | 'firstKills' | 'firstDeaths' | 'utilityDamage'
>;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'kills', label: 'K' },
  { key: 'deaths', label: 'D' },
  { key: 'assists', label: 'A' },
  { key: 'kd', label: 'K/D' },
  { key: 'adr', label: 'ADR' },
  { key: 'hsPercent', label: 'HS%' },
  { key: 'firstKills', label: 'FK' },
  { key: 'firstDeaths', label: 'FD' },
  { key: 'utilityDamage', label: 'UD' },
];

interface StatsTableProps {
  stats: PlayerStats[];
}

export function StatsTable({ stats }: StatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('kills');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: SortKey) => {
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

  const headerRow = (
    <tr className="text-zinc-400 text-xs">
      <th className="text-left py-2 px-3 font-medium">Player</th>
      {COLUMNS.map((col) => (
        <th
          key={col.key}
          className="py-2 px-2 font-medium cursor-pointer hover:text-white text-center"
          onClick={() => handleSort(col.key)}
        >
          {col.label}
          {sortKey === col.key && (sortDesc ? ' \u25BC' : ' \u25B2')}
        </th>
      ))}
    </tr>
  );

  const renderRow = (player: PlayerStats) => (
    <tr key={player.steamId} className="border-t border-zinc-800 hover:bg-zinc-800/50">
      <td className="py-2 px-3 text-sm text-white">{player.name}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.kills}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.deaths}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.assists}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.kd.toFixed(2)}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.adr}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.hsPercent}%</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.firstKills}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.firstDeaths}</td>
      <td className="py-2 px-2 text-center text-sm text-zinc-300">{player.utilityDamage}</td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <div className="rounded-lg overflow-hidden border border-blue-900/50">
        <div className="bg-blue-950/30 px-3 py-1.5 text-xs font-medium text-blue-400">
          Counter-Terrorists
        </div>
        <table className="w-full">
          <thead>{headerRow}</thead>
          <tbody>{ctPlayers.map(renderRow)}</tbody>
        </table>
      </div>

      <div className="rounded-lg overflow-hidden border border-yellow-900/50">
        <div className="bg-yellow-950/30 px-3 py-1.5 text-xs font-medium text-yellow-400">
          Terrorists
        </div>
        <table className="w-full">
          <thead>{headerRow}</thead>
          <tbody>{tPlayers.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}

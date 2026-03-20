'use client';

import type { DemoFrame, FramePlayer } from '@/modules/demo/model';

interface PlayerListProps {
  frame: DemoFrame | null;
}

export function PlayerList({ frame }: PlayerListProps) {
  if (!frame) {
    return (
      <aside className="w-64 border-l border-zinc-800 p-4">
        <p className="text-zinc-500 text-sm">No frame data</p>
      </aside>
    );
  }

  const ctPlayers = frame.players.filter((p) => p.team === 'CT');
  const tPlayers = frame.players.filter((p) => p.team === 'T');

  return (
    <aside className="w-64 border-l border-zinc-800 overflow-y-auto">
      <TeamSection label="Counter-Terrorists" color="text-blue-400" players={ctPlayers} />
      <TeamSection label="Terrorists" color="text-yellow-400" players={tPlayers} />
    </aside>
  );
}

function TeamSection({
  label,
  color,
  players,
}: {
  label: string;
  color: string;
  players: FramePlayer[];
}) {
  return (
    <div className="p-3">
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>
        {label}
      </h3>
      <div className="space-y-1">
        {players.map((player) => (
          <div
            key={player.steamId}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
              player.isAlive ? '' : 'opacity-40'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{player.name}</p>
              <p className="text-xs text-zinc-500">
                {player.activeWeapon ?? 'None'} &middot; ${player.money}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${
                player.health > 50 ? 'text-green-400' :
                player.health > 25 ? 'text-yellow-400' :
                player.health > 0 ? 'text-red-400' : 'text-zinc-600'
              }`}>
                {player.health}
              </p>
              <p className="text-xs text-zinc-600">{player.armor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

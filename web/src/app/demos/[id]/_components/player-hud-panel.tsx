'use client';

import { Shield, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpectatorStore } from '@/stores/spectator-store';
import { getWeaponImagePath } from '../_utils/format-weapon';
import { cn } from '@/lib/utils';
import type { DemoFrame, FramePlayer, PlayerStats } from '@/modules/demo/model';

interface PlayerHudPanelProps {
  frame: DemoFrame | null;
  stats?: PlayerStats[];
}

export function PlayerHudPanel({ frame, stats }: PlayerHudPanelProps) {
  const selectedSteamId = useSpectatorStore((s) => s.selectedSteamId);
  const setSelected = useSpectatorStore((s) => s.setSelected);

  const ctPlayers = frame?.players.filter((p) => p.team === 'CT') ?? [];
  const tPlayers = frame?.players.filter((p) => p.team === 'T') ?? [];

  return (
    <aside className="flex flex-col shrink-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-1.5 py-1 space-y-px">
          {ctPlayers.map((player) => (
            <PlayerRow
              key={player.steamId}
              player={player}
              playerStats={stats?.find((s) => s.steamId === player.steamId)}
              teamColor="blue"
              isSelected={player.steamId === selectedSteamId}
              onSelect={setSelected}
            />
          ))}
        </div>
        <div className="h-2" />
        <div className="px-1.5 py-1 space-y-px">
          {tPlayers.map((player) => (
            <PlayerRow
              key={player.steamId}
              player={player}
              playerStats={stats?.find((s) => s.steamId === player.steamId)}
              teamColor="yellow"
              isSelected={player.steamId === selectedSteamId}
              onSelect={setSelected}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

function PlayerRow({
  player,
  playerStats,
  teamColor,
  isSelected,
  onSelect,
}: {
  player: FramePlayer;
  playerStats?: PlayerStats;
  teamColor: 'blue' | 'yellow';
  isSelected: boolean;
  onSelect: (steamId: string | null) => void;
}) {
  const hpColor =
    player.health > 50
      ? 'text-white'
      : player.health > 25
        ? 'text-yellow-400'
        : 'text-red-400';

  const moneyColor =
    player.money >= 4000
      ? 'text-green-400'
      : player.money >= 2000
        ? 'text-yellow-400'
        : 'text-red-400';

  const hpBarBg = teamColor === 'blue' ? 'bg-blue-500' : 'bg-yellow-500';
  const sideBarColor = teamColor === 'blue' ? 'bg-blue-500' : 'bg-yellow-500';

  return (
    <button
      onClick={() => onSelect(isSelected ? null : player.steamId)}
      className={cn(
        'relative w-full rounded-sm text-left transition-colors overflow-hidden',
        isSelected
          ? 'ring-1 ring-white/10'
          : 'hover:bg-white/[0.03]',
        !player.isAlive && 'opacity-40',
      )}
    >
      {/* Side bar */}
      <div className={cn('absolute inset-y-0 left-0 w-0.5', sideBarColor)} />

      {/* HP bar as background */}
      {player.isAlive && (
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            hpBarBg,
            isSelected ? 'opacity-[0.25]' : 'opacity-[0.15]',
          )}
          style={{ width: `${player.health}%` }}
        />
      )}

      <div className="relative flex items-center h-9 px-2 gap-1">
        {/* HP number */}
        <span
          className={cn(
            'w-7 text-right text-xs font-bold tabular-nums shrink-0',
            player.isAlive ? hpColor : 'text-muted-foreground',
          )}
        >
          {player.isAlive ? player.health : 0}
        </span>

        {/* Armor indicator */}
        <span className="w-4 flex items-center justify-center shrink-0">
          {player.isAlive && player.armor > 0 && (
            player.hasHelmet ? (
              <ShieldCheck className="size-3 text-muted-foreground/70" />
            ) : (
              <Shield className="size-3 text-muted-foreground/50" />
            )
          )}
        </span>

        {/* Weapon image */}
        {player.isAlive && player.activeWeapon ? (
          <div className="flex items-center justify-center w-[52px] h-5 shrink-0">
            <img
              src={getWeaponImagePath(player.activeWeapon)}
              alt=""
              className="h-5 w-auto max-w-[52px] brightness-0 invert opacity-70"
              onError={(e) => {
                e.currentTarget.src = '/weapons/knife.png';
              }}
            />
          </div>
        ) : (
          <div className="w-[52px] h-5 shrink-0" />
        )}

        {/* Name */}
        <span className="text-xs font-medium truncate flex-1 min-w-0 text-white">
          {player.name}
        </span>

        {/* Defuser badge (CT only) */}
        {player.isAlive && player.hasDefuser && player.team === 'CT' && (
          <span className="text-[9px] text-blue-400/70 font-medium shrink-0">
            D
          </span>
        )}

        {/* Money */}
        <span className={cn('text-[10px] tabular-nums shrink-0', moneyColor)}>
          ${player.money}
        </span>

        {/* KDA */}
        <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
          {playerStats
            ? `${playerStats.kills}/${playerStats.deaths}/${playerStats.assists}`
            : `${player.killsTotal}/${player.deathsTotal}/${player.assistsTotal}`}
        </span>
      </div>
    </button>
  );
}

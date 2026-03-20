'use client';

import {
  Shield,
  ShieldCheck,
  Eye,
  Wrench,
  CircleDot,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpectatorStore } from '@/stores/spectator-store';
import { getWeaponImagePath } from '../_utils/format-weapon';
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
        <TeamRoster
          label="CT"
          color="blue"
          players={ctPlayers}
          stats={stats}
          selectedSteamId={selectedSteamId}
          onSelect={setSelected}
        />
        <TeamRoster
          label="T"
          color="yellow"
          players={tPlayers}
          stats={stats}
          selectedSteamId={selectedSteamId}
          onSelect={setSelected}
        />
      </ScrollArea>
    </aside>
  );
}

function TeamRoster({
  label,
  color,
  players,
  stats,
  selectedSteamId,
  onSelect,
}: {
  label: string;
  color: 'blue' | 'yellow';
  players: FramePlayer[];
  stats?: PlayerStats[];
  selectedSteamId: string | null;
  onSelect: (steamId: string | null) => void;
}) {
  const textColor = color === 'blue' ? 'text-blue-400' : 'text-yellow-400';

  return (
    <div className="px-2 py-1.5">
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${textColor} px-1 mb-0.5`}
      >
        {label}
      </p>
      <div className="space-y-0.5">
        {players.map((player) => {
          const isSelected = player.steamId === selectedSteamId;
          return (
            <PlayerRow
              key={player.steamId}
              player={player}
              playerStats={stats?.find((s) => s.steamId === player.steamId)}
              teamColor={color}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
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
  const nameColor =
    teamColor === 'blue' ? 'text-blue-400' : 'text-yellow-400';
  const moneyColor =
    player.money >= 4000
      ? 'text-green-400'
      : player.money >= 2000
        ? 'text-yellow-400'
        : 'text-red-400';
  const hpBarColor =
    player.health > 50
      ? 'bg-green-500'
      : player.health > 25
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <button
      onClick={() => onSelect(isSelected ? null : player.steamId)}
      className={`w-full px-1.5 py-1 rounded-sm text-left transition-colors ${
        isSelected
          ? 'bg-primary/15 ring-1 ring-primary/30'
          : 'hover:bg-muted/40'
      } ${!player.isAlive ? 'opacity-40' : ''}`}
    >
      {/* Line 1: name, status icons, money, KDA, weapon SVG */}
      <div className="flex items-center gap-1">
        <span
          className={`text-xs font-bold truncate min-w-0 ${nameColor}`}
        >
          {player.name}
        </span>

        {player.isAlive && (
          <>
            {player.isScoped && (
              <Eye className="size-2.5 text-cyan-400 shrink-0" />
            )}
            {player.isDefusing && (
              <Wrench className="size-2.5 text-green-400 shrink-0" />
            )}
            {player.hasDefuser && player.team === 'CT' && (
              <CircleDot className="size-2.5 text-blue-400 shrink-0" />
            )}
          </>
        )}

        <span className="flex-1" />

        <span
          className={`text-[10px] font-bold tabular-nums shrink-0 ${moneyColor}`}
        >
          ${player.money}
        </span>

        <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
          {playerStats
            ? `${playerStats.kills}/${playerStats.deaths}/${playerStats.assists}`
            : `${player.killsTotal}/${player.deathsTotal}/${player.assistsTotal}`}
        </span>

        {player.isAlive && player.activeWeapon && (
          <img
            src={getWeaponImagePath(player.activeWeapon)}
            alt=""
            className="h-5 w-auto brightness-0 invert opacity-70 shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/weapons/knife.png';
            }}
          />
        )}
      </div>

      {/* Line 2: HP bar + armor OR "DEAD" */}
      {player.isAlive ? (
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all ${hpBarColor}`}
              style={{ width: `${player.health}%` }}
            />
          </div>
          <span className="text-[10px] font-bold tabular-nums w-7 text-right shrink-0">
            {player.health}
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground flex items-center gap-0.5 shrink-0">
            {player.hasHelmet ? (
              <ShieldCheck className="size-2.5" />
            ) : (
              <Shield className="size-2.5" />
            )}
            {player.armor}
          </span>
          {playerStats && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              ADR {Math.round(playerStats.adr)}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-destructive/60 mt-0.5">DEAD</p>
      )}
    </button>
  );
}


'use client';

import { useState, useMemo, useCallback } from 'react';
import { Bomb as BombIcon, Crosshair } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getWeaponImagePath } from '../_utils/format-weapon';
import { usePlaybackStore } from '@/stores/playback-store';
import { useEventHighlightStore } from '@/stores/event-highlight-store';
import type { KillEvent, GrenadeEvent, BombEvent, FramePlayer } from '@/modules/demo/model';

const TICK_INTERVAL = 4;

interface RoundEventFeedProps {
  kills: KillEvent[];
  grenades: GrenadeEvent[];
  bombEvents: BombEvent[];
  currentTick: number;
  players: FramePlayer[];
  startTick: number;
  tickRate: number;
}

type FeedEntry =
  | { type: 'kill'; tick: number; data: KillEvent }
  | { type: 'grenade'; tick: number; data: GrenadeEvent }
  | { type: 'bomb'; tick: number; data: BombEvent };

const GRENADE_LABELS: Record<string, string> = {
  flashbang: 'Flash',
  hegrenade: 'HE',
  smokegrenade: 'Smoke',
  molotov: 'Molotov',
  decoy: 'Decoy',
};

function formatRoundTime(tick: number, startTick: number, tickRate: number): string {
  const elapsed = Math.max(0, Math.floor((tick - startTick) / tickRate));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getEventPosition(entry: FeedEntry): { x: number; y: number } | null {
  switch (entry.type) {
    case 'kill':
      return { x: entry.data.x, y: entry.data.y };
    case 'grenade':
      return { x: entry.data.x, y: entry.data.y };
    case 'bomb':
      return { x: entry.data.x, y: entry.data.y };
    default:
      return null;
  }
}

export function RoundEventFeed({
  kills,
  grenades,
  bombEvents,
  currentTick,
  players,
  startTick,
  tickRate,
}: RoundEventFeedProps) {
  const setFrameIndex = usePlaybackStore((s) => s.setFrameIndex);
  const setHighlight = useEventHighlightStore((s) => s.setHighlight);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback(
    (index: number, entry: FeedEntry) => {
      setHoveredIndex(index);
      const pos = getEventPosition(entry);
      if (pos) {
        setHighlight({
          gameX: pos.x,
          gameY: pos.y,
          attackerSteamId: entry.type === 'kill' ? entry.data.attackerSteamId : undefined,
        });
      }
    },
    [setHighlight],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setHighlight(null);
  }, [setHighlight]);

  const teamBySteamId = useMemo(() => {
    const map = new Map<string, 'CT' | 'T'>();
    for (const p of players) {
      map.set(p.steamId, p.team);
    }
    return map;
  }, [players]);

  const entries = useMemo(() => {
    const all: FeedEntry[] = [
      ...kills.map((k) => ({ type: 'kill' as const, tick: k.tick, data: k })),
      ...grenades.map((g) => ({ type: 'grenade' as const, tick: g.tick, data: g })),
      ...bombEvents
        .filter((b) => b.action === 'planted' || b.action === 'defused' || b.action === 'exploded')
        .map((b) => ({ type: 'bomb' as const, tick: b.tick, data: b })),
    ];
    return all
      .filter((e) => e.tick <= currentTick)
      .sort((a, b) => b.tick - a.tick);
  }, [kills, grenades, bombEvents, currentTick]);

  const handleEventClick = useCallback(
    (entry: FeedEntry) => {
      const frameIndex = Math.floor((entry.tick - startTick) / TICK_INTERVAL);
      setFrameIndex(Math.max(0, frameIndex));

      const pos = getEventPosition(entry);
      if (pos) {
        setHighlight({
          gameX: pos.x,
          gameY: pos.y,
          attackerSteamId: entry.type === 'kill' ? entry.data.attackerSteamId : undefined,
        });
      }
    },
    [startTick, setFrameIndex, setHighlight],
  );

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden">
      <div className="px-2 py-1 space-y-0.5">
        {entries.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic py-2">No events yet</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={`${entry.type}-${entry.tick}-${i}`}
              onMouseEnter={() => handleMouseEnter(i, entry)}
              onMouseLeave={handleMouseLeave}
            >
              <FeedRow
                entry={entry}
                teamBySteamId={teamBySteamId}
                time={formatRoundTime(entry.tick, startTick, tickRate)}
                onClick={() => handleEventClick(entry)}
              />
              {hoveredIndex === i && entry.type === 'kill' && (
                <KillTooltip kill={entry.data} teamBySteamId={teamBySteamId} time={formatRoundTime(entry.tick, startTick, tickRate)} />
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function FeedRow({
  entry,
  teamBySteamId,
  time,
  onClick,
}: {
  entry: FeedEntry;
  teamBySteamId: Map<string, 'CT' | 'T'>;
  time: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 text-[10px] leading-tight cursor-pointer rounded px-0.5 hover:bg-white/5 transition-colors"
      onClick={onClick}
    >
      <span className="text-muted-foreground tabular-nums shrink-0 w-7 text-right">{time}</span>
      <span className="text-white/20 shrink-0">|</span>
      {entry.type === 'kill' && <KillContent kill={entry.data} teamBySteamId={teamBySteamId} />}
      {entry.type === 'grenade' && <GrenadeContent grenade={entry.data} teamBySteamId={teamBySteamId} />}
      {entry.type === 'bomb' && <BombContent bomb={entry.data} teamBySteamId={teamBySteamId} />}
    </div>
  );
}

function teamColor(steamId: string, map: Map<string, 'CT' | 'T'>) {
  return map.get(steamId) === 'CT' ? 'text-blue-400' : 'text-yellow-400';
}

function KillContent({ kill, teamBySteamId }: { kill: KillEvent; teamBySteamId: Map<string, 'CT' | 'T'> }) {
  const badges: string[] = [];
  if (kill.headshot) badges.push('HS');
  if (kill.wallbang) badges.push('WB');
  if (kill.noscope) badges.push('NS');
  if (kill.thrusmoke) badges.push('SM');
  if (kill.blindKill) badges.push('BL');

  return (
    <>
      <span className={`font-semibold truncate max-w-16 ${teamColor(kill.attackerSteamId, teamBySteamId)}`}>
        {kill.attackerName}
      </span>
      <img
        src={getWeaponImagePath(kill.weapon)}
        alt=""
        className="h-3 w-auto max-w-8 brightness-0 invert opacity-70 shrink-0"
        onError={(e) => { e.currentTarget.src = '/weapons/knife.png'; }}
      />
      {badges.length > 0 && (
        <span className="flex gap-0.5 shrink-0">
          {badges.map((b) => (
            <span
              key={b}
              className="px-0.5 rounded bg-white/10 text-[8px] font-bold text-red-400"
            >
              {b}
            </span>
          ))}
        </span>
      )}
      <span className={`font-semibold truncate max-w-16 ${teamColor(kill.victimSteamId, teamBySteamId)}`}>
        {kill.victimName}
      </span>
    </>
  );
}

function GrenadeContent({ grenade, teamBySteamId }: { grenade: GrenadeEvent; teamBySteamId: Map<string, 'CT' | 'T'> }) {
  return (
    <>
      <span className={`font-semibold truncate max-w-16 ${teamColor(grenade.playerSteamId, teamBySteamId)}`}>
        {grenade.playerName}
      </span>
      <img
        src={getWeaponImagePath(grenade.grenadeType)}
        alt=""
        className="h-3 w-auto max-w-8 brightness-0 invert opacity-50 shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span className="text-muted-foreground">
        {GRENADE_LABELS[grenade.grenadeType] ?? grenade.grenadeType}
      </span>
    </>
  );
}

function BombContent({ bomb, teamBySteamId }: { bomb: BombEvent; teamBySteamId: Map<string, 'CT' | 'T'> }) {
  const actionStyle =
    bomb.action === 'defused'
      ? 'text-green-400'
      : 'text-red-400';

  return (
    <>
      <BombIcon className="size-2.5 text-orange-400 shrink-0" />
      <span className={`font-semibold truncate max-w-16 ${teamColor(bomb.playerSteamId, teamBySteamId)}`}>
        {bomb.playerName}
      </span>
      <span className={`font-semibold ${actionStyle}`}>
        {bomb.action}
      </span>
    </>
  );
}

const BADGE_LABELS: Record<string, string> = {
  HS: 'Headshot',
  WB: 'Wallbang',
  NS: 'Noscope',
  SM: 'Thru Smoke',
  BL: 'Blind Kill',
};

function KillTooltip({
  kill,
  teamBySteamId,
  time,
}: {
  kill: KillEvent;
  teamBySteamId: Map<string, 'CT' | 'T'>;
  time: string;
}) {
  const badges: string[] = [];
  if (kill.headshot) badges.push('HS');
  if (kill.wallbang) badges.push('WB');
  if (kill.noscope) badges.push('NS');
  if (kill.thrusmoke) badges.push('SM');
  if (kill.blindKill) badges.push('BL');

  return (
    <div className="bg-popover/95 backdrop-blur-sm rounded-md border border-white/10 px-2.5 py-2 text-[10px] ml-8 mb-0.5 space-y-1.5 shadow-lg">
      <div className="flex items-center gap-1.5">
        <span className={`font-semibold ${teamColor(kill.attackerSteamId, teamBySteamId)}`}>
          {kill.attackerName}
        </span>
        <span className="text-muted-foreground">&rarr;</span>
        <span className={`font-semibold ${teamColor(kill.victimSteamId, teamBySteamId)}`}>
          {kill.victimName}
        </span>
        <span className="text-muted-foreground ml-auto tabular-nums">{time}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <img
          src={getWeaponImagePath(kill.weapon)}
          alt={kill.weapon}
          className="h-4 w-auto max-w-12 brightness-0 invert opacity-70"
          onError={(e) => { e.currentTarget.src = '/weapons/knife.png'; }}
        />
        <span className="text-muted-foreground capitalize">{kill.weapon}</span>
      </div>
      {badges.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {badges.map((b) => (
            <span
              key={b}
              className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-medium text-red-400"
            >
              {BADGE_LABELS[b]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useRef } from 'react';
import { Bomb, ShieldCheck, Skull, Timer } from 'lucide-react';
import { usePlaybackStore } from '@/stores/playback-store';
import { useRadarFullscreenStore } from '@/stores/radar-fullscreen-store';
import { cn } from '@/lib/utils';
import { useScrollIntoView } from '../_hooks/use-scroll-into-view';
import type {
  DemoRound,
  DemoPlayer,
  KillEvent,
  BombEvent,
} from '@/modules/demo/model';

interface RoundCardListProps {
  rounds: DemoRound[];
  totalRounds: number;
  kills?: KillEvent[];
  bombEvents?: BombEvent[];
  players?: DemoPlayer[];
}

function splitIntoHalves(totalRounds: number) {
  const halves: { label: string; start: number; end: number }[] = [];
  halves.push({ label: '1st Half', start: 1, end: Math.min(12, totalRounds) });
  if (totalRounds > 12) {
    halves.push({
      label: '2nd Half',
      start: 13,
      end: Math.min(24, totalRounds),
    });
  }
  if (totalRounds > 24) {
    const otRounds = totalRounds - 24;
    const otHalves = Math.ceil(otRounds / 6);
    for (let i = 0; i < otHalves; i++) {
      const start = 25 + i * 6;
      const end = Math.min(start + 5, totalRounds);
      halves.push({ label: `OT${i + 1}`, start, end });
    }
  }
  return halves;
}

const WIN_REASON_ICON: Record<string, React.ReactNode> = {
  bomb_exploded: <Bomb className="size-3" />,
  bomb_defused: <ShieldCheck className="size-3" />,
  t_eliminated: <Skull className="size-3" />,
  ct_eliminated: <Skull className="size-3" />,
  time_expired: <Timer className="size-3" />,
};

function getTeamForRound(
  originalTeam: 'CT' | 'T',
  roundNumber: number,
): 'CT' | 'T' {
  const isSwapped =
    roundNumber >= 13 && roundNumber <= 24
      ? true
      : roundNumber > 24
        ? Math.floor((roundNumber - 25) / 3) % 2 === 1
        : false;
  if (!isSwapped) return originalTeam;
  return originalTeam === 'CT' ? 'T' : 'CT';
}

interface RoundKillData {
  ctKills: number;
  tKills: number;
  ctHeadshots: number;
  tHeadshots: number;
  weapons: string[];
  hadBombPlant: boolean;
  hadBombDefuse: boolean;
  hadBombExplode: boolean;
}

export function RoundCardList({
  rounds,
  totalRounds,
  kills,
  bombEvents,
  players,
}: RoundCardListProps) {
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const setRound = usePlaybackStore((s) => s.setRound);
  const isFullscreen = useRadarFullscreenStore((s) => s.isFullscreen);
  const halves = splitIntoHalves(totalRounds);

  const playerTeamMap = useMemo(() => {
    if (!players) return new Map<string, 'CT' | 'T'>();
    return new Map(players.map((p) => [p.steamId, p.team]));
  }, [players]);

  const roundDataMap = useMemo(() => {
    const map = new Map<number, RoundKillData>();

    const killsByRound = new Map<number, KillEvent[]>();
    if (kills) {
      for (const k of kills) {
        const arr = killsByRound.get(k.roundNumber);
        if (arr) arr.push(k);
        else killsByRound.set(k.roundNumber, [k]);
      }
    }

    const bombByRound = new Map<number, BombEvent[]>();
    if (bombEvents) {
      for (const b of bombEvents) {
        const arr = bombByRound.get(b.roundNumber);
        if (arr) arr.push(b);
        else bombByRound.set(b.roundNumber, [b]);
      }
    }

    for (let r = 1; r <= totalRounds; r++) {
      const roundKills = killsByRound.get(r) ?? [];
      const roundBombs = bombByRound.get(r) ?? [];

      let ctKills = 0;
      let tKills = 0;
      let ctHeadshots = 0;
      let tHeadshots = 0;
      const weapons: string[] = [];

      for (const k of roundKills) {
        const origTeam = playerTeamMap.get(k.attackerSteamId);
        const team = origTeam ? getTeamForRound(origTeam, r) : null;
        if (team === 'CT') {
          ctKills++;
          if (k.headshot) ctHeadshots++;
        } else if (team === 'T') {
          tKills++;
          if (k.headshot) tHeadshots++;
        }
        weapons.push(k.weapon);
      }

      map.set(r, {
        ctKills,
        tKills,
        ctHeadshots,
        tHeadshots,
        weapons,
        hadBombPlant: roundBombs.some((b) => b.action === 'planted'),
        hadBombDefuse: roundBombs.some((b) => b.action === 'defused'),
        hadBombExplode: roundBombs.some((b) => b.action === 'exploded'),
      });
    }

    return map;
  }, [kills, bombEvents, playerTeamMap, totalRounds]);

  return (
    <div className="flex flex-col overflow-y-auto py-2 px-1.5 h-full">
      {halves.map((half) => (
        <div key={half.label}>
          <div className="flex items-center gap-2 px-1 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {half.label}
            </span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="flex flex-col gap-px">
            {Array.from(
              { length: half.end - half.start + 1 },
              (_, i) => half.start + i,
            ).map((num) => {
              const round = rounds.find((r) => r.roundNumber === num);
              return (
                <RoundCard
                  key={num}
                  roundNumber={num}
                  round={round}
                  data={roundDataMap.get(num)}
                  isActive={currentRound === num}
                  isFullscreen={isFullscreen}
                  onSelect={() => setRound(num)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const WEAPON_ABBREV: Record<string, string> = {
  ak47: 'AK',
  m4a1: 'M4',
  m4a1_silencer: 'M4S',
  awp: 'AWP',
  deagle: 'DEG',
  usp_silencer: 'USP',
  glock: 'GLK',
  famas: 'FMS',
  galil: 'GAL',
  ssg08: 'SCT',
  sg556: 'SG',
  aug: 'AUG',
  p250: 'P250',
  tec9: 'TEC',
  fiveseven: '57',
  cz75: 'CZ',
  mac10: 'MAC',
  mp9: 'MP9',
  ump45: 'UMP',
  mp7: 'MP7',
  mp5sd: 'MP5',
  p90: 'P90',
  bizon: 'BIZ',
  nova: 'NOV',
  xm1014: 'XM',
  mag7: 'MAG',
  sawedoff: 'SAW',
  negev: 'NEG',
  m249: 'M249',
  knife: 'KNF',
  hkp2000: 'P2K',
  elite: 'DUL',
  revolver: 'R8',
  scar20: 'SC20',
  g3sg1: 'G3',
};

function abbreviateWeapon(weapon: string): string {
  const key = weapon.replace('weapon_', '').toLowerCase();
  return WEAPON_ABBREV[key] ?? key.slice(0, 3).toUpperCase();
}

function RoundCard({
  roundNumber,
  round,
  data,
  isActive,
  isFullscreen,
  onSelect,
}: {
  roundNumber: number;
  round?: DemoRound;
  data?: RoundKillData;
  isActive: boolean;
  isFullscreen: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useScrollIntoView(ref, isActive ? roundNumber : null);

  const isCTWin = round?.winner === 'ct_win';
  const isTWin = round?.winner === 't_win';
  const icon = round?.winReason ? WIN_REASON_ICON[round.winReason] : null;
  const totalKills = (data?.ctKills ?? 0) + (data?.tKills ?? 0);

  return (
    <button
      ref={isActive ? ref : undefined}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col gap-0.5 px-2 py-1.5 rounded text-left transition-colors overflow-hidden',
        isActive
          ? isFullscreen
            ? 'bg-white/10 ring-1 ring-white/20'
            : isCTWin
              ? 'bg-blue-500/15 ring-1 ring-blue-500/40'
              : isTWin
                ? 'bg-yellow-500/15 ring-1 ring-yellow-500/40'
                : 'bg-primary/15 ring-1 ring-primary/40'
          : isFullscreen
            ? 'hover:bg-white/5'
            : 'hover:bg-muted/40',
      )}
    >
      {/* Subtle side gradient */}
      {round && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-0.5',
            isCTWin ? 'bg-blue-500' : isTWin ? 'bg-yellow-500' : 'bg-border',
          )}
        />
      )}

      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'font-bold text-sm w-6 text-right',
            isActive
              ? isCTWin
                ? 'text-blue-400'
                : isTWin
                  ? 'text-yellow-400'
                  : 'text-primary'
              : 'text-muted-foreground',
          )}
        >
          {roundNumber}
        </span>

        {round && (
          <>
            {icon && (
              <span
                className={
                  isCTWin
                    ? 'text-blue-400'
                    : isTWin
                      ? 'text-yellow-400'
                      : 'text-muted-foreground'
                }
              >
                {icon}
              </span>
            )}

            <span
              className={cn(
                'text-[9px] font-bold uppercase px-1 py-px rounded-sm',
                isCTWin
                  ? 'bg-blue-500/20 text-blue-400'
                  : isTWin
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'text-muted-foreground',
              )}
            >
              {isCTWin ? 'CT' : isTWin ? 'T' : ''}
            </span>

            <div className="flex-1" />

            <span className="text-[10px] tabular-nums text-muted-foreground">
              {round.scoreCT}
              <span className="text-muted-foreground/40">:</span>
              {round.scoreT}
            </span>
          </>
        )}
      </div>

      {/* Kill bar + info */}
      {data && totalKills > 0 && (
        <div className="flex items-center gap-1.5 pl-[30px]">
          {/* Kill bar */}
          <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-muted/30">
            {data.ctKills > 0 && (
              <div
                className="bg-blue-500/70 h-full"
                style={{ width: `${(data.ctKills / totalKills) * 100}%` }}
              />
            )}
            {data.tKills > 0 && (
              <div
                className="bg-yellow-500/70 h-full"
                style={{ width: `${(data.tKills / totalKills) * 100}%` }}
              />
            )}
          </div>

          {/* Kill counts */}
          <span className="text-[9px] tabular-nums text-muted-foreground">
            {data.ctKills > 0 && (
              <span className="text-blue-400">{data.ctKills}K</span>
            )}
            {data.ctKills > 0 && data.tKills > 0 && (
              <span className="text-muted-foreground/40">-</span>
            )}
            {data.tKills > 0 && (
              <span className="text-yellow-400">{data.tKills}K</span>
            )}
          </span>

          {/* Bomb indicator */}
          {data.hadBombPlant && (
            <Bomb
              className={cn(
                'size-2.5',
                data.hadBombDefuse
                  ? 'text-blue-400'
                  : data.hadBombExplode
                    ? 'text-red-400'
                    : 'text-yellow-400/60',
              )}
            />
          )}
        </div>
      )}

      {/* Weapon summary */}
      {data && data.weapons.length > 0 && (
        <div className="pl-[30px] text-[9px] text-muted-foreground/60 truncate leading-none">
          {data.weapons
            .slice(0, 4)
            .map((w) => abbreviateWeapon(w))
            .join(' ')}
          {data.weapons.length > 4 && ` +${data.weapons.length - 4}`}
        </div>
      )}
    </button>
  );
}

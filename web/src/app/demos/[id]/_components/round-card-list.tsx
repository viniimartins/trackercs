'use client';

import { useMemo, useRef } from 'react';
import { Bomb, ShieldCheck, Skull, Timer } from 'lucide-react';
import { usePlaybackStore } from '@/stores/playback-store';
import { useRadarFullscreenStore } from '@/stores/radar-fullscreen-store';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useScrollIntoView } from '../_hooks/use-scroll-into-view';
import type {
  DemoRound,
  DemoPlayer,
  BombEvent,
  KillEvent,
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

const WIN_REASON_LABEL: Record<string, string> = {
  bomb_exploded: 'Bomb exploded',
  bomb_defused: 'Bomb defused',
  t_eliminated: 'Terrorists eliminated',
  ct_eliminated: 'CTs eliminated',
  time_expired: 'Time expired',
};

const WIN_REASON_ICON: Record<string, React.ReactNode> = {
  bomb_exploded: <Bomb className="size-3" />,
  bomb_defused: <ShieldCheck className="size-3" />,
  t_eliminated: <Skull className="size-3" />,
  ct_eliminated: <Skull className="size-3" />,
  time_expired: <Timer className="size-3" />,
};

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

  const bombByRound = useMemo(() => {
    const map = new Map<number, BombEvent[]>();
    if (bombEvents) {
      for (const b of bombEvents) {
        const arr = map.get(b.roundNumber);
        if (arr) arr.push(b);
        else map.set(b.roundNumber, [b]);
      }
    }
    return map;
  }, [bombEvents]);

  const ctSteamIds = useMemo(() => {
    const ids = new Set<string>();
    if (players) {
      for (const p of players) {
        if (p.team === 'CT') ids.add(p.steamId);
      }
    }
    return ids;
  }, [players]);

  const killsByRound = useMemo(() => {
    const map = new Map<number, { ctKills: number; tKills: number }>();
    if (kills) {
      for (const k of kills) {
        let entry = map.get(k.roundNumber);
        if (!entry) {
          entry = { ctKills: 0, tKills: 0 };
          map.set(k.roundNumber, entry);
        }
        if (ctSteamIds.has(k.attackerSteamId)) {
          entry.ctKills++;
        } else {
          entry.tKills++;
        }
      }
    }
    return map;
  }, [kills, ctSteamIds]);

  return (
    <TooltipProvider delay={200}>
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
              const roundBombs = bombByRound.get(num);
              const roundKills = killsByRound.get(num);
              return (
                <RoundCard
                  key={num}
                  roundNumber={num}
                  round={round}
                  bombData={roundBombs}
                  killData={roundKills}
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
    </TooltipProvider>
  );
}

function RoundCard({
  roundNumber,
  round,
  bombData,
  killData,
  isActive,
  isFullscreen,
  onSelect,
}: {
  roundNumber: number;
  round?: DemoRound;
  bombData?: BombEvent[];
  killData?: { ctKills: number; tKills: number };
  isActive: boolean;
  isFullscreen: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useScrollIntoView(ref, isActive ? roundNumber : null);

  const isCTWin = round?.winner === 'ct_win';
  const isTWin = round?.winner === 't_win';
  const icon = round?.winReason ? WIN_REASON_ICON[round.winReason] : null;

  const hadBombPlant = bombData?.some((b) => b.action === 'planted') ?? false;
  const hadBombDefuse = bombData?.some((b) => b.action === 'defused') ?? false;
  const hadBombExplode = bombData?.some((b) => b.action === 'exploded') ?? false;

  return (
    <button
      ref={isActive ? ref : undefined}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col gap-0.5 px-2.5 py-1.5 rounded text-left overflow-hidden',
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
      {/* Side bar */}
      {round && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-[3px]',
            isCTWin ? 'bg-blue-500' : isTWin ? 'bg-yellow-500' : 'bg-border',
          )}
        />
      )}

      {/* Line 1: Round number + score + icons */}
      <div className="flex items-center gap-1 w-full">
        <span
          className={cn(
            'font-bold text-xs w-5 text-right tabular-nums shrink-0',
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
            <span className="text-[10px] tabular-nums text-muted-foreground/70 shrink-0">
              {round.scoreCT}:{round.scoreT}
            </span>

            <div className="flex-1" />

            {icon && round.winReason && (
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent side="right">
                  {WIN_REASON_LABEL[round.winReason]}
                </TooltipContent>
              </Tooltip>
            )}

            {hadBombPlant && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Bomb
                    className={cn(
                      'size-2.5 shrink-0',
                      hadBombDefuse
                        ? 'text-blue-400'
                        : hadBombExplode
                          ? 'text-red-400'
                          : 'text-yellow-400/60',
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {hadBombDefuse
                    ? 'Planted & Defused'
                    : hadBombExplode
                      ? 'Planted & Exploded'
                      : 'Bomb planted'}
                </TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>

      {/* Line 2: Kill counts */}
      {round && killData && (
        <div className="flex items-center pl-6">
          <span className="text-[10px] tabular-nums shrink-0">
            <span className="text-blue-400/70">{killData.ctKills}</span>
            <span className="text-muted-foreground/40"> - </span>
            <span className="text-yellow-400/70">{killData.tKills}</span>
          </span>
        </div>
      )}
    </button>
  );
}

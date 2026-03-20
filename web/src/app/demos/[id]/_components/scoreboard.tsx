'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Crosshair } from 'lucide-react';
import { usePlaybackStore } from '@/stores/playback-store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Demo, DemoRound, DemoFrame } from '@/modules/demo/model';

const CS2_BOMB_TIMER_SECONDS = 40;

type RoundPhase = 'freeze' | 'live' | 'planted' | 'ended';

function getRoundPhase(
  frame: DemoFrame | null,
  round: DemoRound | undefined,
  isBombPlanted: boolean,
  tickRate: number,
): RoundPhase {
  if (!frame || !round) return 'freeze';
  if (frame.tick >= round.endTick - 4) return 'ended';
  if (isBombPlanted) return 'planted';
  const freezeEndTick = round.freezeEndTick && round.freezeEndTick > round.startTick
    ? round.freezeEndTick
    : round.startTick + 15 * tickRate;
  if (frame.tick < freezeEndTick) return 'freeze';
  return 'live';
}

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getTimerDisplay(
  frame: DemoFrame | null,
  round: DemoRound | undefined,
  tickRate: number,
  phase: RoundPhase,
  bombPlantTick: number | null,
): string {
  if (!frame || !round || tickRate === 0) return '0:00';

  const freezeEndTick = round.freezeEndTick && round.freezeEndTick > round.startTick
    ? round.freezeEndTick
    : round.startTick + 15 * tickRate;
  const roundTimeSeconds = round.roundTimeSeconds ?? 115;

  switch (phase) {
    case 'freeze': {
      return formatCountdown(roundTimeSeconds);
    }
    case 'live': {
      const elapsedSinceFreezeEnd = (frame.tick - freezeEndTick) / tickRate;
      return formatCountdown(roundTimeSeconds - elapsedSinceFreezeEnd);
    }
    case 'planted': {
      if (bombPlantTick === null) return '0:00';
      const elapsed = (frame.tick - bombPlantTick) / tickRate;
      const remaining = CS2_BOMB_TIMER_SECONDS - elapsed;
      return formatCountdown(remaining);
    }
    case 'ended': {
      // Freeze at 0:00
      return '0:00';
    }
  }
}

interface ScoreboardProps {
  demo: Demo;
  rounds: DemoRound[];
  frame: DemoFrame | null;
  bombPlantTick: number | null;
}

export function Scoreboard({ demo, rounds, frame, bombPlantTick }: ScoreboardProps) {
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const round = rounds.find((r) => r.roundNumber === currentRound);

  const isBombPlanted = frame?.bomb?.state === 'planted' && bombPlantTick !== null;
  const phase = getRoundPhase(frame, round, isBombPlanted, demo.tickRate);

  const scoreCT = round?.scoreCT ?? 0;
  const scoreT = round?.scoreT ?? 0;
  const time = getTimerDisplay(frame, round, demo.tickRate, phase, bombPlantTick);

  const timerClassName = cn(
    'text-base font-black tabular-nums tracking-tight',
    phase === 'freeze' && 'text-yellow-400',
    phase === 'live' && 'text-foreground',
    phase === 'planted' && 'text-red-400 animate-pulse',
    phase === 'ended' && 'text-muted-foreground',
  );

  return (
    <div className="relative border-b border-border bg-card/50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-yellow-500/5" />
      {phase === 'planted' && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse border-b border-red-500/30" />
      )}

      <div className="relative flex items-center justify-between px-4 py-2">
        {/* Left — Back + map badge */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <Link
            href="/demos"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <Badge variant="outline" className="text-[10px]">
            {demo.mapName}
          </Badge>
        </div>

        {/* Center — Teams + scores + round info */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-blue-400" />
            <p className="text-blue-400 font-medium text-xs tracking-wide">{demo.teamCT}</p>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tabular-nums text-blue-400 min-w-[2ch] text-right">
                {scoreCT}
              </span>
              <span className="text-2xl font-light text-muted-foreground/50 select-none">:</span>
              <span className="text-3xl font-black tabular-nums text-yellow-400 min-w-[2ch] text-left">
                {scoreT}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={timerClassName}>{time}</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                R{currentRound}/{demo.totalRounds}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-yellow-400 font-medium text-xs tracking-wide">{demo.teamT}</p>
            <Crosshair className="size-4 text-yellow-400" />
          </div>
        </div>

        {/* Right — spacer for balance */}
        <div className="min-w-[140px]" />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Star } from 'lucide-react';
import { usePlaybackStore } from '@/stores/playback-store';
import { Badge } from '@/components/ui/badge';
import type { Demo, DemoRound, DemoFrame } from '@/modules/demo/model';

interface ScoreboardProps {
  demo: Demo;
  rounds: DemoRound[];
  frame: DemoFrame | null;
}

function formatRoundTime(frame: DemoFrame | null, round: DemoRound | undefined, tickRate: number) {
  if (!frame || !round || tickRate === 0) return '0:00';
  const elapsedTicks = frame.tick - round.startTick;
  const elapsedSeconds = Math.max(0, Math.floor(elapsedTicks / tickRate));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Scoreboard({ demo, rounds, frame }: ScoreboardProps) {
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const round = rounds.find((r) => r.roundNumber === currentRound);

  const scoreCT = round?.scoreCT ?? 0;
  const scoreT = round?.scoreT ?? 0;
  const time = formatRoundTime(frame, round, demo.tickRate);

  return (
    <div className="relative border-b border-border bg-card/50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-yellow-500/5" />

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
            <p className="text-blue-400 font-semibold text-sm tracking-wide">{demo.teamCT}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-black tabular-nums text-blue-400 min-w-[2ch] text-right">
              {scoreCT}
            </span>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm text-foreground font-bold tabular-nums">{time}</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Round {currentRound}/{demo.totalRounds}
              </span>
            </div>

            <span className="text-3xl font-black tabular-nums text-yellow-400 min-w-[2ch] text-left">
              {scoreT}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-yellow-400 font-semibold text-sm tracking-wide">{demo.teamT}</p>
            <Star className="size-4 text-yellow-400" />
          </div>
        </div>

        {/* Right — spacer for balance */}
        <div className="min-w-[140px]" />
      </div>
    </div>
  );
}

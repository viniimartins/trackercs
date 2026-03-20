'use client';

import Link from 'next/link';
import { usePlaybackStore } from '@/stores/playback-store';
import type { Demo, DemoRound } from '@/modules/demo/model';

interface ScoreboardProps {
  demo: Demo;
  rounds: DemoRound[];
}

export function Scoreboard({ demo, rounds }: ScoreboardProps) {
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const round = rounds.find((r) => r.roundNumber === currentRound);

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <Link
        href="/demos"
        className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
      >
        &larr; Back
      </Link>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-blue-400 font-semibold">{demo.teamCT}</p>
          <p className="text-xs text-zinc-500">CT</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums">
            <span className="text-blue-400">{round?.scoreCT ?? demo.scoreCT}</span>
            <span className="text-zinc-600 mx-2">:</span>
            <span className="text-yellow-400">{round?.scoreT ?? demo.scoreT}</span>
          </p>
          <p className="text-xs text-zinc-500">{demo.mapName}</p>
        </div>
        <div className="text-left">
          <p className="text-yellow-400 font-semibold">{demo.teamT}</p>
          <p className="text-xs text-zinc-500">T</p>
        </div>
      </div>

      <p className="text-zinc-600 text-sm">Round {currentRound}</p>
    </div>
  );
}

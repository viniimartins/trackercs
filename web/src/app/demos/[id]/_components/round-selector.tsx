'use client';

import { usePlaybackStore } from '@/stores/playback-store';
import type { DemoRound } from '@/modules/demo/model';

interface RoundSelectorProps {
  rounds: DemoRound[];
  totalRounds: number;
}

export function RoundSelector({ rounds, totalRounds }: RoundSelectorProps) {
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const setRound = usePlaybackStore((s) => s.setRound);

  return (
    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
      <span className="text-zinc-500 text-sm mr-2 shrink-0">Round:</span>
      {Array.from({ length: totalRounds }, (_, i) => i + 1).map((num) => {
        const round = rounds.find((r) => r.roundNumber === num);
        const isActive = currentRound === num;

        let bgColor = 'bg-zinc-800';
        if (round?.winner === 'ct_win') bgColor = 'bg-blue-900/40';
        else if (round?.winner === 't_win') bgColor = 'bg-yellow-900/40';

        return (
          <button
            key={num}
            onClick={() => setRound(num)}
            className={`min-w-[32px] h-8 text-xs rounded transition-colors ${bgColor} ${
              isActive
                ? 'ring-2 ring-blue-500 text-white font-bold'
                : 'text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
}

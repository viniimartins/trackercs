'use client';

import { useState } from 'react';
import { useFindDemoById } from '@/modules/demo/queries/find-demo-by-id';
import { useFindDemoRounds } from '@/modules/demo/queries/find-demo-rounds';
import { useFindRoundFrames } from '@/modules/demo/queries/find-round-frames';
import { useFindDemoStats } from '@/modules/demo/queries/find-demo-stats';
import { usePlaybackStore } from '@/stores/playback-store';
import { RadarCanvas } from './_components/radar-canvas';
import { PlaybackControls } from './_components/playback-controls';
import { RoundSelector } from './_components/round-selector';
import { PlayerList } from './_components/player-list';
import { Scoreboard } from './_components/scoreboard';
import { StatsTable } from './_components/stats-table';
import { RoundTimeline } from './_components/round-timeline';
import { usePlaybackLoop } from './_hooks/use-playback-loop';
import { useRoundEvents } from './_hooks/use-round-events';
import { useRoundTimelineEvents } from './_hooks/use-round-timeline-events';

type Tab = 'radar' | 'stats';

export function DemoViewerContent({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('radar');
  const { data: demo, isLoading: demoLoading } = useFindDemoById(id);
  const { data: rounds } = useFindDemoRounds(id);
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const currentFrameIndex = usePlaybackStore((s) => s.currentFrameIndex);
  const { data: frames } = useFindRoundFrames(id, currentRound);
  const { data: stats } = useFindDemoStats(id, activeTab === 'stats');

  usePlaybackLoop(frames ?? []);

  const { grenades } = useRoundEvents(id, currentRound);
  const { events: timelineEvents } = useRoundTimelineEvents(
    id,
    currentRound,
    rounds ?? [],
  );

  const currentFrame = frames?.[currentFrameIndex];

  if (demoLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Demo not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <Scoreboard demo={demo} rounds={rounds ?? []} />

      <div className="flex gap-1 px-4 pt-2">
        <button
          className={`px-4 py-1.5 text-sm rounded-t-md ${
            activeTab === 'radar'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
          onClick={() => setActiveTab('radar')}
        >
          Radar
        </button>
        <button
          className={`px-4 py-1.5 text-sm rounded-t-md ${
            activeTab === 'stats'
              ? 'bg-zinc-800 text-white'
              : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
      </div>

      {activeTab === 'radar' ? (
        <>
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4">
              <RadarCanvas
                mapName={demo.mapName}
                frame={currentFrame ?? null}
                grenades={grenades}
              />
            </div>

            <PlayerList frame={currentFrame ?? null} />
          </div>

          <div className="border-t border-zinc-800">
            <RoundTimeline
              events={timelineEvents}
              totalFrames={frames?.length ?? 0}
            />
            <RoundSelector
              rounds={rounds ?? []}
              totalRounds={demo.totalRounds}
            />
            <PlaybackControls totalFrames={frames?.length ?? 0} />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          {stats ? (
            <StatsTable stats={stats} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

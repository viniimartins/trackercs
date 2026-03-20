'use client';

import { useFindDemoById } from '@/modules/demo/queries/find-demo-by-id';
import { useFindDemoRounds } from '@/modules/demo/queries/find-demo-rounds';
import { useFindRoundFrames } from '@/modules/demo/queries/find-round-frames';
import { useFindDemoStats } from '@/modules/demo/queries/find-demo-stats';
import { useFindDemoEconomy } from '@/modules/demo/queries/find-demo-economy';
import { useFindDemoEvents } from '@/modules/demo/queries/find-demo-events';
import { useFindDemoHeatmap } from '@/modules/demo/queries/find-demo-heatmap';
import { usePlaybackStore } from '@/stores/playback-store';
import { useRadarFullscreenStore } from '@/stores/radar-fullscreen-store';
import { useRadarLayersStore } from '@/stores/radar-layers-store';
import { useSpectatorStore } from '@/stores/spectator-store';
import { useTacticalBoardStore } from '@/stores/tactical-board-store';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadarCanvas } from './_components/radar-canvas';
import { PlaybackControls } from './_components/playback-controls';
import { RoundCardList } from './_components/round-card-list';
import { PlayerHudPanel } from './_components/player-hud-panel';
import { RoundEventFeed } from './_components/round-event-feed';
import { Scoreboard } from './_components/scoreboard';
import { RoundTimeline } from './_components/round-timeline';
import { StatsTable } from './_components/stats-table';
import { EconomyChart } from './_components/economy-chart';
import { PlayerComparison } from './_components/player-comparison';
import { TacticalBoard } from './_components/tactical-board';
import { HitgroupChart } from './_components/hitgroup-chart';
import { useMemo } from 'react';
import { usePlaybackLoop } from './_hooks/use-playback-loop';
import { useRoundEvents } from './_hooks/use-round-events';
import { useRoundTimelineEvents } from './_hooks/use-round-timeline-events';

export function DemoViewerContent({ id }: { id: string }) {
  const { data: demo, isLoading: demoLoading } = useFindDemoById(id);
  const { data: rounds } = useFindDemoRounds(id);
  const currentRound = usePlaybackStore((s) => s.currentRound);
  const currentFrameIndex = usePlaybackStore((s) => s.currentFrameIndex);
  const { data: frames } = useFindRoundFrames(id, currentRound);
  const { data: stats } = useFindDemoStats(id);
  const { data: economy } = useFindDemoEconomy(id);
  const { data: allDamages } = useFindDemoEvents(id, 'damage');
  const { data: allKills } = useFindDemoEvents(id, 'kills');
  const { data: allBombEvents } = useFindDemoEvents(id, 'bomb');

  const heatmapEnabled = useRadarLayersStore((s) => s.heatmap);
  const heatmapType = useRadarLayersStore((s) => s.heatmapType);
  const { data: heatmap } = useFindDemoHeatmap(id, heatmapType, heatmapEnabled);

  const isTacticalActive = useTacticalBoardStore((s) => s.isActive);
  const selectedSteamId = useSpectatorStore((s) => s.selectedSteamId);

  usePlaybackLoop(frames ?? []);

  const { grenades, kills, damages } = useRoundEvents(id, currentRound);
  const { events: timelineEvents } = useRoundTimelineEvents(
    id,
    currentRound,
    rounds ?? [],
  );

  const roundBombEvents = useMemo(
    () => allBombEvents?.filter((b) => b.roundNumber === currentRound) ?? [],
    [allBombEvents, currentRound],
  );

  const currentRoundData = useMemo(
    () => rounds?.find((r) => r.roundNumber === currentRound),
    [rounds, currentRound],
  );

  const bombPlantTick = useMemo(() => {
    const plantEvent = roundBombEvents.find((b) => b.action === 'planted');
    return plantEvent?.tick ?? null;
  }, [roundBombEvents]);

  const isFullscreen = useRadarFullscreenStore((s) => s.isFullscreen);
  const currentFrame = frames?.[currentFrameIndex];

  if (demoLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!demo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Demo not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {!isFullscreen && (
        <Scoreboard demo={demo} rounds={rounds ?? []} frame={currentFrame ?? null} bombPlantTick={bombPlantTick} />
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left — Round cards */}
        {!isFullscreen && (
          <div className="absolute left-0 top-0 h-full z-10 w-44 border-r border-white/10">
            <RoundCardList
              rounds={rounds ?? []}
              totalRounds={demo.totalRounds}
              kills={allKills}
              bombEvents={allBombEvents}
              players={demo.players}
            />
          </div>
        )}

        {/* Center — Radar (always visible, fills entire area) */}
        <div className={`relative flex-1 min-h-0 min-w-0 flex items-center justify-center ${!isFullscreen ? 'pl-44 pr-80' : ''}`}>
          <RadarCanvas
            mapName={demo.mapName}
            frame={currentFrame ?? null}
            grenades={grenades}
            kills={kills}
            damages={damages}
            heatmap={heatmapEnabled ? heatmap ?? null : null}
            footer={
              <div className="shrink-0 bg-card/80 backdrop-blur-sm">
                <RoundTimeline
                  events={timelineEvents}
                  totalFrames={frames?.length ?? 0}
                />
                <PlaybackControls totalFrames={frames?.length ?? 0} />
              </div>
            }
          />
          {isTacticalActive && <TacticalBoard />}

          {/* Event feed overlay */}
          {!isFullscreen && (
            <div className="absolute top-2 right-2 z-20 w-56 max-h-[60%] bg-card/80 backdrop-blur-sm rounded-lg border border-white/10 flex flex-col">
              <div className="shrink-0 px-2 py-1 border-b border-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Events</p>
              </div>
              <RoundEventFeed
                kills={kills}
                grenades={grenades}
                bombEvents={roundBombEvents}
                currentTick={currentFrame?.tick ?? 0}
                players={currentFrame?.players ?? []}
                startTick={currentRoundData?.startTick ?? 0}
                tickRate={demo.tickRate}
              />
            </div>
          )}
        </div>

        {/* Right — Tabbed panel */}
        {!isFullscreen && (
          <div className="absolute right-0 top-0 h-full z-10 w-80 bg-card/80 backdrop-blur-sm flex flex-col border-l border-white/10">
            <Tabs defaultValue="players" className="flex-1 min-h-0 flex flex-col">
              <TabsList variant="line" className="shrink-0 px-2 py-1 border-b border-white/10">
                <TabsTrigger value="players" className="text-xs">Players</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                <TabsTrigger value="economy" className="text-xs">Eco</TabsTrigger>
                <TabsTrigger value="compare" className="text-xs">Cmp</TabsTrigger>
                <TabsTrigger value="damage" className="text-xs">Dmg</TabsTrigger>
              </TabsList>

              <TabsContent value="players" className="flex-1 min-h-0 overflow-auto">
                <PlayerHudPanel
                  frame={currentFrame ?? null}
                  stats={stats}
                />
              </TabsContent>

              <TabsContent value="stats" className="flex-1 min-h-0 overflow-auto p-2">
                {stats && <StatsTable stats={stats} />}
              </TabsContent>

              <TabsContent value="economy" className="flex-1 min-h-0 overflow-auto p-2">
                {economy && (
                  <EconomyChart
                    economy={economy}
                    currentRound={currentRound}
                    className="h-full"
                  />
                )}
              </TabsContent>

              <TabsContent value="compare" className="flex-1 min-h-0 overflow-auto p-2">
                {stats && <PlayerComparison stats={stats} />}
              </TabsContent>

              <TabsContent value="damage" className="flex-1 min-h-0 overflow-auto p-2">
                {allDamages && (
                  <HitgroupChart
                    damages={allDamages}
                    selectedSteamId={selectedSteamId}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

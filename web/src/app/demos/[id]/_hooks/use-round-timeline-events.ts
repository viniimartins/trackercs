import { useMemo } from 'react';

import { useFindDemoEvents } from '@/modules/demo/queries/find-demo-events';
import type { DemoRound } from '@/modules/demo/model';

export interface TimelineEvent {
  tick: number;
  frameIndex: number;
  type: 'kill' | 'bomb_plant' | 'bomb_defuse' | 'bomb_explode';
  label: string;
  team: 'CT' | 'T';
}

const TICK_INTERVAL = 4;

export function useRoundTimelineEvents(
  demoId: string,
  currentRound: number,
  rounds: DemoRound[],
) {
  const { data: kills } = useFindDemoEvents(demoId, 'kills');
  const { data: bombEvents } = useFindDemoEvents(demoId, 'bomb');

  const events = useMemo<TimelineEvent[]>(() => {
    const round = rounds.find((r) => r.roundNumber === currentRound);
    if (!round) return [];

    const result: TimelineEvent[] = [];

    if (kills) {
      for (const kill of kills) {
        if (kill.roundNumber !== currentRound) continue;
        result.push({
          tick: kill.tick,
          frameIndex: Math.floor((kill.tick - round.startTick) / TICK_INTERVAL),
          type: 'kill',
          label: `${kill.attackerName} → ${kill.victimName}`,
          team: kill.victimSteamId === kill.attackerSteamId ? 'T' : 'CT',
        });
      }
    }

    if (bombEvents) {
      for (const bomb of bombEvents) {
        if (bomb.roundNumber !== currentRound) continue;
        if (bomb.action === 'planted') {
          result.push({
            tick: bomb.tick,
            frameIndex: Math.floor((bomb.tick - round.startTick) / TICK_INTERVAL),
            type: 'bomb_plant',
            label: `Bomb planted by ${bomb.playerName}`,
            team: 'T',
          });
        } else if (bomb.action === 'defused') {
          result.push({
            tick: bomb.tick,
            frameIndex: Math.floor((bomb.tick - round.startTick) / TICK_INTERVAL),
            type: 'bomb_defuse',
            label: `Bomb defused by ${bomb.playerName}`,
            team: 'CT',
          });
        } else if (bomb.action === 'exploded') {
          result.push({
            tick: bomb.tick,
            frameIndex: Math.floor((bomb.tick - round.startTick) / TICK_INTERVAL),
            type: 'bomb_explode',
            label: 'Bomb exploded',
            team: 'T',
          });
        }
      }
    }

    return result.sort((a, b) => a.tick - b.tick);
  }, [kills, bombEvents, currentRound, rounds]);

  return { events };
}

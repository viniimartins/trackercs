import { useMemo } from 'react';

import { useFindDemoEvents } from '@/modules/demo/queries/find-demo-events';
import type { GrenadeEvent, KillEvent, DamageEvent } from '@/modules/demo/model';

export function useRoundEvents(demoId: string, roundNumber: number) {
  const { data: allGrenades } = useFindDemoEvents(demoId, 'grenades');
  const { data: allKills } = useFindDemoEvents(demoId, 'kills');
  const { data: allDamages } = useFindDemoEvents(demoId, 'damage');

  const grenades = useMemo<GrenadeEvent[]>(() => {
    if (!allGrenades) return [];
    return allGrenades.filter((g) => g.roundNumber === roundNumber);
  }, [allGrenades, roundNumber]);

  const kills = useMemo<KillEvent[]>(() => {
    if (!allKills) return [];
    return allKills.filter((k) => k.roundNumber === roundNumber);
  }, [allKills, roundNumber]);

  const damages = useMemo<DamageEvent[]>(() => {
    if (!allDamages) return [];
    return allDamages.filter((d) => d.roundNumber === roundNumber);
  }, [allDamages, roundNumber]);

  return { grenades, kills, damages };
}

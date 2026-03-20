import { useMemo } from 'react';

import { useFindDemoEvents } from '@/modules/demo/queries/find-demo-events';
import type { GrenadeEvent } from '@/modules/demo/model';

export function useRoundEvents(demoId: string, roundNumber: number) {
  const { data: allGrenades } = useFindDemoEvents(demoId, 'grenades');

  const grenades = useMemo<GrenadeEvent[]>(() => {
    if (!allGrenades) return [];
    return allGrenades.filter((g) => g.roundNumber === roundNumber);
  }, [allGrenades, roundNumber]);

  return { grenades };
}

import { useEffect, type DependencyList, type EffectCallback } from 'react';

export function useMountEffect(
  effect: EffectCallback,
  deps?: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, deps);
}

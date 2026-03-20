import { useEffect, type RefObject } from 'react';

export function useScrollIntoView(
  ref: RefObject<HTMLElement | null>,
  dependency: unknown,
) {
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [ref, dependency]);
}

import { useEffect, type RefObject } from 'react';

export function useCanvasRender(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    render(ctx, rect.width, rect.height);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const c = canvas.getContext('2d');
        if (!c) return;
        c.scale(dpr, dpr);
        render(c, width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasRef, containerRef, render]);
}

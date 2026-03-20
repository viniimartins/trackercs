'use client';

import { useRef, useCallback, useState } from 'react';
import type { DemoEconomy } from '@/modules/demo/queries/find-demo-economy';
import { cn } from '@/lib/utils';
import { useCanvasRender } from '../_hooks/use-canvas-render';

interface EconomyChartProps {
  economy: DemoEconomy;
  currentRound: number;
  className?: string;
}

const CT_COLOR = '#3b82f6';
const T_COLOR = '#eab308';
const PADDING = { top: 30, right: 20, bottom: 40, left: 60 };

export function EconomyChart({ economy, currentRound, className }: EconomyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    round: number;
    ctMoney: number;
    tMoney: number;
    ctEquip: number;
    tEquip: number;
  } | null>(null);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const { rounds } = economy;
      if (rounds.length === 0) return;

      ctx.clearRect(0, 0, width, height);

      const chartW = width - PADDING.left - PADDING.right;
      const chartH = height - PADDING.top - PADDING.bottom;
      const maxMoney = Math.max(
        ...rounds.map((r) => Math.max(r.ctMoney + r.ctEquip, r.tMoney + r.tEquip)),
        1,
      );

      const barGroupW = chartW / rounds.length;
      const barW = Math.max(barGroupW * 0.35, 2);
      const gap = barGroupW * 0.08;

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const gridSteps = 5;
      for (let i = 0; i <= gridSteps; i++) {
        const y = PADDING.top + (chartH / gridSteps) * i;
        ctx.beginPath();
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(width - PADDING.right, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxMoney - (maxMoney / gridSteps) * i;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`$${Math.round(value / 1000)}k`, PADDING.left - 8, y + 3);
      }

      // Bars
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const x = PADDING.left + barGroupW * i;
        const isCurrent = r.round === currentRound;

        // Current round highlight
        if (isCurrent) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x, PADDING.top, barGroupW, chartH);
        }

        // CT bar (money + equip stacked)
        const ctTotal = r.ctMoney + r.ctEquip;
        const ctH = (ctTotal / maxMoney) * chartH;
        const ctMoneyH = (r.ctMoney / maxMoney) * chartH;
        const ctEquipH = ctH - ctMoneyH;
        const ctX = x + gap;

        ctx.fillStyle = CT_COLOR;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(ctX, PADDING.top + chartH - ctH, barW, ctEquipH);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(ctX, PADDING.top + chartH - ctMoneyH, barW, ctMoneyH);
        ctx.globalAlpha = 1;

        // T bar
        const tTotal = r.tMoney + r.tEquip;
        const tH = (tTotal / maxMoney) * chartH;
        const tMoneyH = (r.tMoney / maxMoney) * chartH;
        const tEquipH = tH - tMoneyH;
        const tX = ctX + barW + gap;

        ctx.fillStyle = T_COLOR;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(tX, PADDING.top + chartH - tH, barW, tEquipH);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(tX, PADDING.top + chartH - tMoneyH, barW, tMoneyH);
        ctx.globalAlpha = 1;

        // X-axis label
        ctx.fillStyle = isCurrent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)';
        ctx.font = isCurrent ? 'bold 10px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(r.round), x + barGroupW / 2, height - PADDING.bottom + 14);
      }

      // Legend
      ctx.font = '11px sans-serif';
      const legendY = 14;
      ctx.fillStyle = CT_COLOR;
      ctx.fillRect(PADDING.left, legendY - 8, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText('CT', PADDING.left + 14, legendY);

      ctx.fillStyle = T_COLOR;
      ctx.fillRect(PADDING.left + 40, legendY - 8, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('T', PADDING.left + 54, legendY);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText('(darker = cash, lighter = equipment)', PADDING.left + 74, legendY);
    },
    [economy, currentRound],
  );

  useCanvasRender(canvasRef, containerRef, render);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const chartW = canvas.width / (window.devicePixelRatio || 1) - PADDING.left - PADDING.right;
      const barGroupW = chartW / economy.rounds.length;
      const idx = Math.floor((x - PADDING.left) / barGroupW);
      const round = economy.rounds[idx];
      if (round) {
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          round: round.round,
          ctMoney: round.ctMoney,
          tMoney: round.tMoney,
          ctEquip: round.ctEquip,
          tEquip: round.tEquip,
        });
      } else {
        setTooltip(null);
      }
    },
    [economy],
  );

  return (
    <div ref={containerRef} className={cn("relative w-full", className ?? "h-64")}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-card/95 border border-border rounded-md px-3 py-2 text-xs shadow-lg z-10"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 300) - 160),
            top: Math.max(tooltip.y - 60, 0),
          }}
        >
          <p className="font-semibold mb-1">Round {tooltip.round}</p>
          <p style={{ color: CT_COLOR }}>
            CT: ${tooltip.ctMoney.toLocaleString()} + ${tooltip.ctEquip.toLocaleString()} equip
          </p>
          <p style={{ color: T_COLOR }}>
            T: ${tooltip.tMoney.toLocaleString()} + ${tooltip.tEquip.toLocaleString()} equip
          </p>
        </div>
      )}
    </div>
  );
}

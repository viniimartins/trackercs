'use client';

import { useRef, useCallback, useState } from 'react';
import { Pen, ArrowRight, Type, Eraser, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useTacticalBoardStore,
  type DrawPoint,
  type Drawing,
  type DrawTool,
  type DrawColor,
} from '@/stores/tactical-board-store';

const TOOLS: { tool: DrawTool; icon: typeof Pen; label: string }[] = [
  { tool: 'pen', icon: Pen, label: 'Pen' },
  { tool: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'eraser', icon: Eraser, label: 'Eraser' },
];

const COLORS: DrawColor[] = ['#3b82f6', '#eab308', '#ef4444', '#22c55e'];

export function TacticalBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawings = useTacticalBoardStore((s) => s.drawings);
  const activeTool = useTacticalBoardStore((s) => s.activeTool);
  const activeColor = useTacticalBoardStore((s) => s.activeColor);
  const setTool = useTacticalBoardStore((s) => s.setTool);
  const setColor = useTacticalBoardStore((s) => s.setColor);
  const addDrawing = useTacticalBoardStore((s) => s.addDrawing);
  const clearAll = useTacticalBoardStore((s) => s.clearAll);

  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<DrawPoint[]>([]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (activeTool === 'text') {
        const point = getCanvasPoint(e);
        const text = prompt('Enter text:');
        if (text) {
          addDrawing({
            id: crypto.randomUUID(),
            tool: 'text',
            color: activeColor,
            points: [point],
            text,
          });
        }
        return;
      }

      setIsDrawing(true);
      currentPoints.current = [getCanvasPoint(e)];
    },
    [activeTool, activeColor, addDrawing, getCanvasPoint],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      currentPoints.current.push(getCanvasPoint(e));
      renderAll();
    },
    [isDrawing, getCanvasPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.current.length < 2) return;

    if (activeTool === 'eraser') {
      // Eraser doesn't save, just clears nearby drawings
      // For simplicity, we don't implement per-stroke erasing
    } else {
      addDrawing({
        id: crypto.randomUUID(),
        tool: activeTool,
        color: activeColor,
        points: [...currentPoints.current],
      });
    }
    currentPoints.current = [];
  }, [isDrawing, activeTool, activeColor, addDrawing]);

  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Render saved drawings
    for (const d of drawings) {
      renderDrawing(ctx, d, w, h);
    }

    // Render current stroke
    if (isDrawing && currentPoints.current.length > 1) {
      renderDrawing(
        ctx,
        {
          id: 'current',
          tool: activeTool,
          color: activeColor,
          points: currentPoints.current,
        },
        w,
        h,
      );
    }
  }, [drawings, isDrawing, activeTool, activeColor]);

  // Re-render when drawings change
  const prevLen = useRef(drawings.length);
  if (prevLen.current !== drawings.length) {
    prevLen.current = drawings.length;
    requestAnimationFrame(renderAll);
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={1024}
        height={1024}
        className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Toolbar */}
      <div className="absolute top-2 left-2 z-30 bg-card/90 backdrop-blur-sm rounded-lg p-1.5 flex items-center gap-1 ring-1 ring-border">
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <Button
            key={tool}
            variant={activeTool === tool ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setTool(tool)}
            title={label}
          >
            <Icon className="size-3.5" />
          </Button>
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setColor(color)}
            className={`size-5 rounded-full border-2 transition-all ${
              activeColor === color ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="icon-xs" onClick={clearAll} title="Clear all">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function renderDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  w: number,
  h: number,
) {
  const points = drawing.points.map((p) => ({ x: p.x * w, y: p.y * h }));

  if (drawing.tool === 'text' && drawing.text && points.length > 0) {
    ctx.font = `bold ${16}px sans-serif`;
    ctx.fillStyle = drawing.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(drawing.text, points[0].x, points[0].y);
    ctx.fillText(drawing.text, points[0].x, points[0].y);
    return;
  }

  if (points.length < 2) return;

  ctx.strokeStyle = drawing.color;
  ctx.lineWidth = drawing.tool === 'eraser' ? 20 : 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (drawing.tool === 'arrow') {
    const start = points[0];
    const end = points[points.length - 1];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLen = 15;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLen * Math.cos(angle - Math.PI / 6),
      end.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }
}

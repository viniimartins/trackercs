'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useFindDashboard } from '@/modules/demo/queries/find-dashboard';
import { useCanvasRender } from '../demos/[id]/_hooks/use-canvas-render';
import type { Dashboard } from '@/modules/demo/queries/find-dashboard';

export function DashboardContent() {
  const router = useRouter();
  const { data, isLoading } = useFindDashboard();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.totalDemos === 0) {
    return (
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Button variant="ghost" onClick={() => router.push('/demos')} className="mb-4">
          <ArrowLeft className="size-4 mr-2" />
          Back to Demos
        </Button>
        <p className="text-muted-foreground">No demos parsed yet. Upload demos first.</p>
      </div>
    );
  }

  const avgRating =
    data.playerAggregates.length > 0
      ? (
          data.playerAggregates.reduce((s, p) => s + p.rating, 0) /
          data.playerAggregates.length
        ).toFixed(2)
      : '0';

  const avgAdr =
    data.playerAggregates.length > 0
      ? Math.round(
          data.playerAggregates.reduce((s, p) => s + p.adr, 0) /
            data.playerAggregates.length,
        )
      : 0;

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push('/demos')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Aggregated statistics across all demos</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Demos" value={String(data.totalDemos)} />
        <SummaryCard label="Total Rounds" value={String(data.totalRounds)} />
        <SummaryCard label="Avg Rating" value={avgRating} />
        <SummaryCard label="Avg ADR" value={String(avgAdr)} />
      </div>

      {/* Map Performance */}
      {data.mapStats.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Map Performance</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Map</TableHead>
                    <TableHead className="text-center">Played</TableHead>
                    <TableHead className="text-center">Wins</TableHead>
                    <TableHead className="text-center">Win Rate</TableHead>
                    <TableHead className="w-[200px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mapStats.map((m) => (
                    <TableRow key={m.map}>
                      <TableCell className="font-medium">{m.map}</TableCell>
                      <TableCell className="text-center">{m.played}</TableCell>
                      <TableCell className="text-center">{m.wins}</TableCell>
                      <TableCell className="text-center">{m.winRate}%</TableCell>
                      <TableCell>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${m.winRate}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Progress Chart */}
      {data.progressByDemo.length > 1 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Progress</h2>
          <Card>
            <CardContent className="p-4">
              <ProgressChart data={data} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Player Leaderboard */}
      {data.playerAggregates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Player Leaderboard</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Demos</TableHead>
                    <TableHead className="text-center">K/D</TableHead>
                    <TableHead className="text-center">ADR</TableHead>
                    <TableHead className="text-center">HS%</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-center">KAST%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.playerAggregates.map((p) => (
                    <TableRow key={p.steamId}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.demos}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.kd.toFixed(2)}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.adr}</TableCell>
                      <TableCell className="text-center tabular-nums">{p.hsPercent}%</TableCell>
                      <TableCell className="text-center tabular-nums font-semibold">
                        <span className={p.rating >= 1.0 ? 'text-green-400' : p.rating >= 0.8 ? 'text-foreground' : 'text-red-400'}>
                          {p.rating.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{p.kast}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent Demos */}
      {data.recentDemos.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-3">Recent Demos</h2>
          <div className="grid gap-3">
            {data.recentDemos.map((demo) => (
              <Card
                key={demo.id}
                className="cursor-pointer hover:ring-1 hover:ring-primary/40 transition-all"
                onClick={() => router.push(`/demos/${demo.id}`)}
              >
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{demo.mapName}</Badge>
                    <Badge variant="secondary">
                      <span className="text-blue-400">{demo.scoreCT}</span>
                      <span className="mx-1">-</span>
                      <span className="text-yellow-400">{demo.scoreT}</span>
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {new Date(demo.createdAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

function ProgressChart({ data }: { data: Dashboard }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const points = data.progressByDemo;
      if (points.length < 2) return;

      ctx.clearRect(0, 0, width, height);

      const chartW = width - CHART_PADDING.left - CHART_PADDING.right;
      const chartH = height - CHART_PADDING.top - CHART_PADDING.bottom;

      const ratings = points.map((p) => p.rating);
      const minR = Math.min(...ratings) - 0.1;
      const maxR = Math.max(...ratings) + 0.1;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = CHART_PADDING.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(CHART_PADDING.left, y);
        ctx.lineTo(width - CHART_PADDING.right, y);
        ctx.stroke();

        const val = maxR - ((maxR - minR) / 4) * i;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(2), CHART_PADDING.left - 8, y + 3);
      }

      // 1.00 reference line
      const oneY = CHART_PADDING.top + ((maxR - 1.0) / (maxR - minR)) * chartH;
      if (oneY > CHART_PADDING.top && oneY < height - CHART_PADDING.bottom) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(CHART_PADDING.left, oneY);
        ctx.lineTo(width - CHART_PADDING.right, oneY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Line
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      for (let i = 0; i < points.length; i++) {
        const x = CHART_PADDING.left + (i / (points.length - 1)) * chartW;
        const y =
          CHART_PADDING.top +
          ((maxR - points[i].rating) / (maxR - minR)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dots
      for (let i = 0; i < points.length; i++) {
        const x = CHART_PADDING.left + (i / (points.length - 1)) * chartW;
        const y =
          CHART_PADDING.top +
          ((maxR - points[i].rating) / (maxR - minR)) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = points[i].rating >= 1.0 ? '#4ade80' : '#ef4444';
        ctx.fill();
      }

      // X labels (map names)
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      const maxLabels = Math.min(points.length, 10);
      const step = Math.max(1, Math.floor(points.length / maxLabels));
      for (let i = 0; i < points.length; i += step) {
        const x = CHART_PADDING.left + (i / (points.length - 1)) * chartW;
        ctx.fillText(
          points[i].mapName.replace('de_', ''),
          x,
          height - CHART_PADDING.bottom + 16,
        );
      }
    },
    [data],
  );

  useCanvasRender(canvasRef, containerRef, render);

  return (
    <div ref={containerRef} className="w-full h-48">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { DamageEvent } from '@/modules/demo/model';

interface HitgroupChartProps {
  damages: DamageEvent[];
  selectedSteamId?: string | null;
}

const HITGROUP_LABELS: Record<number, string> = {
  0: 'Generic',
  1: 'Head',
  2: 'Chest',
  3: 'Stomach',
  4: 'Left Arm',
  5: 'Right Arm',
  6: 'Left Leg',
  7: 'Right Leg',
};

const HITGROUP_COLORS: Record<number, string> = {
  0: '#6b7280',
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#22c55e',
  6: '#3b82f6',
  7: '#3b82f6',
};

// SVG body proportions (relative to viewBox 0 0 200 400)
const HITGROUP_REGIONS: Record<number, { x: number; y: number; w: number; h: number }> = {
  1: { x: 70, y: 0, w: 60, h: 60 },    // Head
  2: { x: 55, y: 70, w: 90, h: 60 },    // Chest
  3: { x: 60, y: 130, w: 80, h: 50 },   // Stomach
  4: { x: 20, y: 70, w: 35, h: 90 },    // Left Arm
  5: { x: 145, y: 70, w: 35, h: 90 },   // Right Arm
  6: { x: 55, y: 190, w: 40, h: 120 },  // Left Leg
  7: { x: 105, y: 190, w: 40, h: 120 }, // Right Leg
};

export function HitgroupChart({ damages, selectedSteamId }: HitgroupChartProps) {
  const { given, received } = useMemo(() => {
    const given = new Map<number, number>();
    const received = new Map<number, number>();

    for (const d of damages) {
      if (selectedSteamId) {
        if (d.attackerSteamId === selectedSteamId) {
          given.set(d.hitgroup, (given.get(d.hitgroup) ?? 0) + d.dmgHealth);
        }
        if (d.victimSteamId === selectedSteamId) {
          received.set(d.hitgroup, (received.get(d.hitgroup) ?? 0) + d.dmgHealth);
        }
      } else {
        given.set(d.hitgroup, (given.get(d.hitgroup) ?? 0) + d.dmgHealth);
      }
    }

    return { given, received };
  }, [damages, selectedSteamId]);

  const maxGiven = Math.max(...given.values(), 1);
  const maxReceived = Math.max(...received.values(), 1);
  const showReceived = selectedSteamId && received.size > 0;

  return (
    <div className="p-3">
      {/* Silhouettes — stacked vertically */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 px-1 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Damage Given</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <BodySilhouette data={given} maxValue={maxGiven} />
        </div>

        {showReceived && (
          <div>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Damage Received</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <BodySilhouette data={received} maxValue={maxReceived} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 mt-4">
        {Object.entries(HITGROUP_LABELS)
          .filter(([key]) => Number(key) > 0)
          .map(([key, label]) => {
            const hg = Number(key);
            const givenVal = given.get(hg) ?? 0;
            const receivedVal = received.get(hg) ?? 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: HITGROUP_COLORS[hg] }}
                />
                <span className="text-[10px] text-muted-foreground w-14">{label}</span>
                <span className="text-[10px] tabular-nums font-medium w-8 text-right">
                  {givenVal}
                </span>
                {selectedSteamId && (
                  <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
                    {receivedVal}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function BodySilhouette({
  data,
  maxValue,
}: {
  data: Map<number, number>;
  maxValue: number;
}) {
  return (
    <svg viewBox="0 0 200 320" className="w-full max-w-[120px] mx-auto">
      {/* Body outline */}
      <g stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none">
        {/* Head */}
        <circle cx="100" cy="30" r="25" />
        {/* Torso */}
        <rect x="60" y="60" width="80" height="120" rx="8" />
        {/* Left Arm */}
        <rect x="25" y="65" width="30" height="100" rx="10" />
        {/* Right Arm */}
        <rect x="145" y="65" width="30" height="100" rx="10" />
        {/* Left Leg */}
        <rect x="60" y="185" width="35" height="120" rx="10" />
        {/* Right Leg */}
        <rect x="105" y="185" width="35" height="120" rx="10" />
      </g>

      {/* Hitgroup overlays */}
      {Object.entries(HITGROUP_REGIONS).map(([key, region]) => {
        const hg = Number(key);
        const value = data.get(hg) ?? 0;
        if (value === 0) return null;
        const intensity = Math.min(value / maxValue, 1);
        const color = HITGROUP_COLORS[hg];

        if (hg === 1) {
          // Head is a circle
          return (
            <circle
              key={key}
              cx="100"
              cy="30"
              r="25"
              fill={color}
              opacity={0.2 + intensity * 0.6}
            />
          );
        }

        return (
          <rect
            key={key}
            x={hg === 4 ? 25 : hg === 5 ? 145 : region.x}
            y={hg === 4 || hg === 5 ? 65 : region.y === 70 ? 60 : region.y}
            width={hg === 4 || hg === 5 ? 30 : hg === 2 ? 80 : region.w}
            height={hg === 4 || hg === 5 ? 100 : hg === 2 ? 65 : hg === 3 ? 55 : region.h}
            rx="8"
            fill={color}
            opacity={0.2 + intensity * 0.6}
          />
        );
      })}
    </svg>
  );
}

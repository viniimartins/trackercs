'use client';

import { Flame, Eye, Crosshair, Swords, Zap, Layers } from 'lucide-react';
import { useRadarLayersStore } from '@/stores/radar-layers-store';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HeatmapType } from '@/modules/demo/queries/find-demo-heatmap';

const HEATMAP_TYPES: { value: HeatmapType; label: string }[] = [
  { value: 'position', label: 'Position' },
  { value: 'kills', label: 'Kills' },
  { value: 'deaths', label: 'Deaths' },
];

export function RadarLayerControls() {
  const grenades = useRadarLayersStore((s) => s.grenades);
  const lineOfSight = useRadarLayersStore((s) => s.lineOfSight);
  const kills = useRadarLayersStore((s) => s.kills);
  const equipment = useRadarLayersStore((s) => s.equipment);
  const damage = useRadarLayersStore((s) => s.damage);
  const heatmap = useRadarLayersStore((s) => s.heatmap);
  const heatmapType = useRadarLayersStore((s) => s.heatmapType);
  const toggleGrenades = useRadarLayersStore((s) => s.toggleGrenades);
  const toggleLineOfSight = useRadarLayersStore((s) => s.toggleLineOfSight);
  const toggleKills = useRadarLayersStore((s) => s.toggleKills);
  const toggleEquipment = useRadarLayersStore((s) => s.toggleEquipment);
  const toggleDamage = useRadarLayersStore((s) => s.toggleDamage);
  const toggleHeatmap = useRadarLayersStore((s) => s.toggleHeatmap);
  const setHeatmapType = useRadarLayersStore((s) => s.setHeatmapType);

  return (
    <TooltipProvider>
      <div className="absolute top-11 left-2 bg-card/80 backdrop-blur-sm rounded-lg p-1 flex flex-col gap-0.5 ring-1 ring-border">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={grenades ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleGrenades}
              >
                <Flame className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Grenades</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={lineOfSight ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleLineOfSight}
              >
                <Eye className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Line of Sight</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={kills ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleKills}
              >
                <Crosshair className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Kills</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={equipment ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleEquipment}
              >
                <Swords className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Equipment</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={damage ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleDamage}
              >
                <Zap className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Damage</TooltipContent>
        </Tooltip>

        <div className="h-px bg-border/50 my-0.5" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={heatmap ? 'secondary' : 'ghost'}
                size="icon-xs"
                onClick={toggleHeatmap}
              >
                <Layers className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent side="right">Heatmap</TooltipContent>
        </Tooltip>

        {heatmap && (
          <div className="flex flex-col gap-0.5 px-0.5">
            {HEATMAP_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setHeatmapType(t.value)}
                className={`text-[9px] px-1 py-0.5 rounded text-left transition-colors ${
                  heatmapType === t.value
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

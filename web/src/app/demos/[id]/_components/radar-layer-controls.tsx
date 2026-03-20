'use client';

import { useRadarLayersStore } from '@/stores/radar-layers-store';

export function RadarLayerControls() {
  const grenades = useRadarLayersStore((s) => s.grenades);
  const lineOfSight = useRadarLayersStore((s) => s.lineOfSight);
  const toggleGrenades = useRadarLayersStore((s) => s.toggleGrenades);
  const toggleLineOfSight = useRadarLayersStore((s) => s.toggleLineOfSight);

  return (
    <div className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur-sm rounded-md p-2 flex flex-col gap-1 text-xs">
      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
        <input
          type="checkbox"
          checked={grenades}
          onChange={toggleGrenades}
          className="accent-blue-500"
        />
        Grenades
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
        <input
          type="checkbox"
          checked={lineOfSight}
          onChange={toggleLineOfSight}
          className="accent-blue-500"
        />
        Line of Sight
      </label>
    </div>
  );
}

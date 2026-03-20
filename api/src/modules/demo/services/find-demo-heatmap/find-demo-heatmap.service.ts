import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoRoundDto } from '../../dto/demo-round.dto.js';
import type { DemoFrameDto } from '../../dto/demo-frame.dto.js';
import type { KillEventDto } from '../../dto/demo-events.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');
const GRID_SIZE = 64;

export type HeatmapType = 'position' | 'kills' | 'deaths';

export interface DemoHeatmapDto {
  grid: number[][];
  maxValue: number;
  gridSize: number;
}

@Injectable()
export class FindDemoHeatmapService {
  execute(id: string, type: HeatmapType): DemoHeatmapDto {
    const demoDir = path.join(DATA_DIR, id);
    if (!fs.existsSync(demoDir)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }

    const cachePath = path.join(demoDir, `heatmap-${type}.json`);
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }

    const grid = Array.from({ length: GRID_SIZE }, () =>
      new Array(GRID_SIZE).fill(0),
    );

    if (type === 'kills' || type === 'deaths') {
      const killsPath = path.join(demoDir, 'events', 'kills.json');
      if (fs.existsSync(killsPath)) {
        const kills: KillEventDto[] = JSON.parse(
          fs.readFileSync(killsPath, 'utf-8'),
        );
        this.populateFromEvents(grid, kills, type);
      }
    } else {
      const rounds: DemoRoundDto[] = JSON.parse(
        fs.readFileSync(path.join(demoDir, 'rounds.json'), 'utf-8'),
      );
      this.populateFromPositions(grid, demoDir, rounds);
    }

    let maxValue = 0;
    for (const row of grid) {
      for (const val of row) {
        if (val > maxValue) maxValue = val;
      }
    }

    const result: DemoHeatmapDto = { grid, maxValue, gridSize: GRID_SIZE };
    fs.writeFileSync(cachePath, JSON.stringify(result));
    return result;
  }

  private populateFromEvents(
    grid: number[][],
    kills: KillEventDto[],
    type: 'kills' | 'deaths',
  ) {
    // We need map bounds to normalize positions
    // Since we don't know exact bounds, use min/max from events
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const k of kills) {
      if (k.x < minX) minX = k.x;
      if (k.x > maxX) maxX = k.x;
      if (k.y < minY) minY = k.y;
      if (k.y > maxY) maxY = k.y;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    // Pad range to avoid edge clipping
    const padX = rangeX * 0.05;
    const padY = rangeY * 0.05;

    for (const k of kills) {
      // For 'kills' we use the kill position (victim's death position)
      // For 'deaths' same position but counted differently
      const cellX = Math.min(
        GRID_SIZE - 1,
        Math.max(0, Math.floor(((k.x - minX + padX) / (rangeX + 2 * padX)) * GRID_SIZE)),
      );
      const cellY = Math.min(
        GRID_SIZE - 1,
        Math.max(0, Math.floor(((k.y - minY + padY) / (rangeY + 2 * padY)) * GRID_SIZE)),
      );
      grid[cellY][cellX]++;
    }
  }

  private populateFromPositions(
    grid: number[][],
    demoDir: string,
    rounds: DemoRoundDto[],
  ) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // First pass: find bounds
    const allFrames: DemoFrameDto[][] = [];
    for (const round of rounds) {
      const framePath = path.join(
        demoDir,
        'frames',
        `round_${round.roundNumber}.json`,
      );
      if (!fs.existsSync(framePath)) continue;
      const frames: DemoFrameDto[] = JSON.parse(
        fs.readFileSync(framePath, 'utf-8'),
      );
      allFrames.push(frames);
      // Sample every 4th frame for performance
      for (let i = 0; i < frames.length; i += 4) {
        for (const p of frames[i].players) {
          if (!p.isAlive) continue;
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padX = rangeX * 0.05;
    const padY = rangeY * 0.05;

    // Second pass: populate grid
    for (const frames of allFrames) {
      for (let i = 0; i < frames.length; i += 4) {
        for (const p of frames[i].players) {
          if (!p.isAlive) continue;
          const cellX = Math.min(
            GRID_SIZE - 1,
            Math.max(0, Math.floor(((p.x - minX + padX) / (rangeX + 2 * padX)) * GRID_SIZE)),
          );
          const cellY = Math.min(
            GRID_SIZE - 1,
            Math.max(0, Math.floor(((p.y - minY + padY) / (rangeY + 2 * padY)) * GRID_SIZE)),
          );
          grid[cellY][cellX]++;
        }
      }
    }
  }
}

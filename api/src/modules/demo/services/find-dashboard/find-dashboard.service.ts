import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoSummaryDto } from '../../dto/demo-summary.dto.js';
import type { PlayerStatsDto } from '../../dto/player-stats.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

interface MapStat {
  map: string;
  played: number;
  wins: number;
  winRate: number;
}

interface PlayerAggregate {
  steamId: string;
  name: string;
  demos: number;
  kills: number;
  deaths: number;
  kd: number;
  adr: number;
  hsPercent: number;
  rating: number;
  kast: number;
}

interface DemoProgress {
  demoId: string;
  date: string;
  mapName: string;
  kd: number;
  adr: number;
  rating: number;
}

export interface DashboardDto {
  totalDemos: number;
  totalRounds: number;
  winRate: number;
  mapStats: MapStat[];
  recentDemos: DemoSummaryDto[];
  playerAggregates: PlayerAggregate[];
  progressByDemo: DemoProgress[];
}

@Injectable()
export class FindDashboardService {
  execute(): DashboardDto {
    if (!fs.existsSync(DATA_DIR)) {
      return {
        totalDemos: 0,
        totalRounds: 0,
        winRate: 0,
        mapStats: [],
        recentDemos: [],
        playerAggregates: [],
        progressByDemo: [],
      };
    }

    const demoIds = fs
      .readdirSync(DATA_DIR)
      .filter((d) =>
        fs.statSync(path.join(DATA_DIR, d)).isDirectory() &&
        fs.existsSync(path.join(DATA_DIR, d, 'summary.json')),
      );

    const summaries: DemoSummaryDto[] = [];
    const allStats: { demoId: string; summary: DemoSummaryDto; stats: PlayerStatsDto[] }[] = [];

    for (const id of demoIds) {
      const summaryPath = path.join(DATA_DIR, id, 'summary.json');
      const summary: DemoSummaryDto = JSON.parse(
        fs.readFileSync(summaryPath, 'utf-8'),
      );
      summaries.push(summary);

      const statsPath = path.join(DATA_DIR, id, 'stats.json');
      if (fs.existsSync(statsPath)) {
        const stats: PlayerStatsDto[] = JSON.parse(
          fs.readFileSync(statsPath, 'utf-8'),
        );
        allStats.push({ demoId: id, summary, stats });
      }
    }

    // Sort by date descending
    summaries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const totalDemos = summaries.length;
    const totalRounds = summaries.reduce((s, d) => s + d.totalRounds, 0);

    // Map stats
    const mapData = new Map<string, { played: number; wins: number }>();
    for (const summary of summaries) {
      const entry = mapData.get(summary.mapName) ?? { played: 0, wins: 0 };
      entry.played++;
      // Simple heuristic: count as "win" if CT wins (user's perspective is ambiguous without login)
      // Just track the data without win/loss bias
      if (summary.scoreCT > summary.scoreT) entry.wins++;
      mapData.set(summary.mapName, entry);
    }

    const mapStats: MapStat[] = [...mapData.entries()].map(
      ([map, { played, wins }]) => ({
        map,
        played,
        wins,
        winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      }),
    );

    // Player aggregates across all demos
    const playerMap = new Map<
      string,
      {
        name: string;
        demos: number;
        kills: number;
        deaths: number;
        totalAdr: number;
        totalHsPercent: number;
        totalRating: number;
        totalKast: number;
      }
    >();

    const progressByDemo: DemoProgress[] = [];

    for (const { demoId, summary, stats } of allStats) {
      for (const s of stats) {
        const existing = playerMap.get(s.steamId) ?? {
          name: s.name,
          demos: 0,
          kills: 0,
          deaths: 0,
          totalAdr: 0,
          totalHsPercent: 0,
          totalRating: 0,
          totalKast: 0,
        };
        existing.name = s.name;
        existing.demos++;
        existing.kills += s.kills;
        existing.deaths += s.deaths;
        existing.totalAdr += s.adr;
        existing.totalHsPercent += s.hsPercent;
        existing.totalRating += s.rating ?? 0;
        existing.totalKast += s.kast ?? 0;
        playerMap.set(s.steamId, existing);
      }

      // Average stats for progress tracking (all players averaged)
      if (stats.length > 0) {
        const avgKd =
          stats.reduce((s, p) => s + p.kd, 0) / stats.length;
        const avgAdr =
          stats.reduce((s, p) => s + p.adr, 0) / stats.length;
        const avgRating =
          stats.reduce((s, p) => s + (p.rating ?? 0), 0) / stats.length;

        progressByDemo.push({
          demoId,
          date: summary.createdAt,
          mapName: summary.mapName,
          kd: Math.round(avgKd * 100) / 100,
          adr: Math.round(avgAdr),
          rating: Math.round(avgRating * 100) / 100,
        });
      }
    }

    progressByDemo.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const playerAggregates: PlayerAggregate[] = [...playerMap.entries()].map(
      ([steamId, p]) => ({
        steamId,
        name: p.name,
        demos: p.demos,
        kills: p.kills,
        deaths: p.deaths,
        kd: Math.round((p.kills / Math.max(p.deaths, 1)) * 100) / 100,
        adr: Math.round(p.totalAdr / p.demos),
        hsPercent: Math.round(p.totalHsPercent / p.demos),
        rating: Math.round((p.totalRating / p.demos) * 100) / 100,
        kast: Math.round(p.totalKast / p.demos),
      }),
    );

    // Sort by rating descending
    playerAggregates.sort((a, b) => b.rating - a.rating);

    // Win rate - overall across all demos
    const totalWins = summaries.filter((s) => s.scoreCT > s.scoreT).length;
    const winRate = totalDemos > 0 ? Math.round((totalWins / totalDemos) * 100) : 0;

    return {
      totalDemos,
      totalRounds,
      winRate,
      mapStats,
      recentDemos: summaries.slice(0, 5),
      playerAggregates,
      progressByDemo,
    };
  }
}

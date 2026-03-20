import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DamageEventDto,KillEventDto } from '../../dto/demo-events.dto.js';
import type { DemoRoundDto } from '../../dto/demo-round.dto.js';
import type { DemoSummaryDto } from '../../dto/demo-summary.dto.js';
import type { PlayerStatsDto } from '../../dto/player-stats.dto.js';
import { StatsCalculatorProvider } from '../../providers/stats-calculator.provider.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class FindDemoStatsService {
  constructor(private readonly calculator: StatsCalculatorProvider) {}

  execute(id: string): PlayerStatsDto[] {
    const demoDir = path.join(DATA_DIR, id);
    if (!fs.existsSync(demoDir)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }

    const statsPath = path.join(demoDir, 'stats.json');
    if (fs.existsSync(statsPath)) {
      const cached: PlayerStatsDto[] = JSON.parse(
        fs.readFileSync(statsPath, 'utf-8'),
      );
      // Invalidate cache if missing new fields (e.g. rating)
      if (cached.length > 0 && cached[0].rating === undefined) {
        // Fall through to recalculate
      } else {
        return cached;
      }
    }

    const summary: DemoSummaryDto = JSON.parse(
      fs.readFileSync(path.join(demoDir, 'summary.json'), 'utf-8'),
    );
    const rounds: DemoRoundDto[] = JSON.parse(
      fs.readFileSync(path.join(demoDir, 'rounds.json'), 'utf-8'),
    );
    const kills: KillEventDto[] = JSON.parse(
      fs.readFileSync(path.join(demoDir, 'events', 'kills.json'), 'utf-8'),
    );
    const damage: DamageEventDto[] = JSON.parse(
      fs.readFileSync(path.join(demoDir, 'events', 'damage.json'), 'utf-8'),
    );

    const stats = this.calculator.calculate(
      kills,
      damage,
      rounds,
      summary.players,
    );

    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    return stats;
  }
}

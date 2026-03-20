import { Module } from '@nestjs/common';

import { FindDemoStatsController } from '../controllers/find-demo-stats.controller.js';
import { FindDemoStatsService } from '../../../services/find-demo-stats/find-demo-stats.service.js';
import { StatsCalculatorProvider } from '../../../providers/stats-calculator.provider.js';

@Module({
  controllers: [FindDemoStatsController],
  providers: [FindDemoStatsService, StatsCalculatorProvider],
})
export class FindDemoStatsModule {}

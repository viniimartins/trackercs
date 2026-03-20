import { Module } from '@nestjs/common';

import { FindDemoHeatmapService } from '../../../services/find-demo-heatmap/find-demo-heatmap.service.js';
import { FindDemoHeatmapController } from '../controllers/find-demo-heatmap.controller.js';

@Module({
  controllers: [FindDemoHeatmapController],
  providers: [FindDemoHeatmapService],
})
export class FindDemoHeatmapModule {}

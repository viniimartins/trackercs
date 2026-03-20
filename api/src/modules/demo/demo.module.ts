import { Module } from '@nestjs/common';

import { FindDemoByIdModule } from './infra/http/modules/find-demo-by-id.module.js';
import { FindDemoEconomyModule } from './infra/http/modules/find-demo-economy.module.js';
import { FindDemoEventsModule } from './infra/http/modules/find-demo-events.module.js';
import { FindDemoHeatmapModule } from './infra/http/modules/find-demo-heatmap.module.js';
import { FindDemoRoundsModule } from './infra/http/modules/find-demo-rounds.module.js';
import { FindDemoStatsModule } from './infra/http/modules/find-demo-stats.module.js';
import { FindDashboardModule } from './infra/http/modules/find-dashboard.module.js';
import { FindRoundFramesModule } from './infra/http/modules/find-round-frames.module.js';
import { ListDemosModule } from './infra/http/modules/list-demos.module.js';
import { ReparseDemoModule } from './infra/http/modules/reparse-demo.module.js';
import { UploadDemoModule } from './infra/http/modules/upload-demo.module.js';

@Module({
  imports: [
    UploadDemoModule,
    FindDemoByIdModule,
    FindDemoRoundsModule,
    FindRoundFramesModule,
    ListDemosModule,
    FindDemoEventsModule,
    ReparseDemoModule,
    FindDemoStatsModule,
    FindDemoEconomyModule,
    FindDemoHeatmapModule,
    FindDashboardModule,
  ],
})
export class DemoModule {}

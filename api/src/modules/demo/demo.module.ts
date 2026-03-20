import { Module } from '@nestjs/common';

import { UploadDemoModule } from './infra/http/modules/upload-demo.module.js';
import { FindDemoByIdModule } from './infra/http/modules/find-demo-by-id.module.js';
import { FindDemoRoundsModule } from './infra/http/modules/find-demo-rounds.module.js';
import { FindRoundFramesModule } from './infra/http/modules/find-round-frames.module.js';
import { ListDemosModule } from './infra/http/modules/list-demos.module.js';
import { FindDemoEventsModule } from './infra/http/modules/find-demo-events.module.js';
import { ReparseDemoModule } from './infra/http/modules/reparse-demo.module.js';
import { FindDemoStatsModule } from './infra/http/modules/find-demo-stats.module.js';

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
  ],
})
export class DemoModule {}

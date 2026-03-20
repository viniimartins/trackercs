import { Module } from '@nestjs/common';

import { FindDemoRoundsService } from '../../../services/find-demo-rounds/find-demo-rounds.service.js';
import { FindDemoRoundsController } from '../controllers/find-demo-rounds.controller.js';

@Module({
  controllers: [FindDemoRoundsController],
  providers: [FindDemoRoundsService],
})
export class FindDemoRoundsModule {}

import { Module } from '@nestjs/common';

import { FindDemoRoundsController } from '../controllers/find-demo-rounds.controller.js';
import { FindDemoRoundsService } from '../../../services/find-demo-rounds/find-demo-rounds.service.js';

@Module({
  controllers: [FindDemoRoundsController],
  providers: [FindDemoRoundsService],
})
export class FindDemoRoundsModule {}

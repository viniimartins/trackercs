import { Module } from '@nestjs/common';

import { FindDemoEventsService } from '../../../services/find-demo-events/find-demo-events.service.js';
import { FindDemoEventsController } from '../controllers/find-demo-events.controller.js';

@Module({
  controllers: [FindDemoEventsController],
  providers: [FindDemoEventsService],
})
export class FindDemoEventsModule {}

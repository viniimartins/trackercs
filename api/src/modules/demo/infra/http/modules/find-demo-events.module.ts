import { Module } from '@nestjs/common';

import { FindDemoEventsController } from '../controllers/find-demo-events.controller.js';
import { FindDemoEventsService } from '../../../services/find-demo-events/find-demo-events.service.js';

@Module({
  controllers: [FindDemoEventsController],
  providers: [FindDemoEventsService],
})
export class FindDemoEventsModule {}

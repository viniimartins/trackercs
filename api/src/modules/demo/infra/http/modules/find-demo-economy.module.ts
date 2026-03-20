import { Module } from '@nestjs/common';

import { FindDemoEconomyService } from '../../../services/find-demo-economy/find-demo-economy.service.js';
import { FindDemoEconomyController } from '../controllers/find-demo-economy.controller.js';

@Module({
  controllers: [FindDemoEconomyController],
  providers: [FindDemoEconomyService],
})
export class FindDemoEconomyModule {}

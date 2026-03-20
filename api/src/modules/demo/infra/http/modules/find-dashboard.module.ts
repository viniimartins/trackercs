import { Module } from '@nestjs/common';

import { FindDashboardService } from '../../../services/find-dashboard/find-dashboard.service.js';
import { FindDashboardController } from '../controllers/find-dashboard.controller.js';

@Module({
  controllers: [FindDashboardController],
  providers: [FindDashboardService],
})
export class FindDashboardModule {}

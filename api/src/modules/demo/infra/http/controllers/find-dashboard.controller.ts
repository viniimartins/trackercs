import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDashboardService } from '../../../services/find-dashboard/find-dashboard.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDashboardController {
  constructor(
    private readonly findDashboardService: FindDashboardService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get aggregated dashboard data across all demos' })
  findDashboard() {
    return this.findDashboardService.execute();
  }
}

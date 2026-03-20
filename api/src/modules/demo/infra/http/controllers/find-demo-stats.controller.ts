import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDemoStatsService } from '../../../services/find-demo-stats/find-demo-stats.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoStatsController {
  constructor(
    private readonly findDemoStatsService: FindDemoStatsService,
  ) {}

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get player stats for a demo' })
  findStats(@Param('id') id: string) {
    return this.findDemoStatsService.execute(id);
  }
}

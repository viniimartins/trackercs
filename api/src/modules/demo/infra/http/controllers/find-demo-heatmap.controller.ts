import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import {
  FindDemoHeatmapService,
  type HeatmapType,
} from '../../../services/find-demo-heatmap/find-demo-heatmap.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoHeatmapController {
  constructor(
    private readonly findDemoHeatmapService: FindDemoHeatmapService,
  ) {}

  @Get(':id/heatmap')
  @ApiOperation({ summary: 'Get heatmap data for a demo' })
  @ApiQuery({ name: 'type', enum: ['position', 'kills', 'deaths'] })
  findHeatmap(
    @Param('id') id: string,
    @Query('type') type: HeatmapType = 'position',
  ) {
    return this.findDemoHeatmapService.execute(id, type);
  }
}

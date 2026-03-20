import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDemoEventsService } from '../../../services/find-demo-events/find-demo-events.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoEventsController {
  constructor(
    private readonly findDemoEventsService: FindDemoEventsService,
  ) {}

  @Get(':id/events/:type')
  @ApiOperation({ summary: 'Get events by type (kills, damage, grenades, bomb)' })
  findEvents(
    @Param('id') id: string,
    @Param('type') type: string,
  ) {
    return this.findDemoEventsService.execute(id, type);
  }
}

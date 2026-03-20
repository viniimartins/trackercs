import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDemoRoundsService } from '../../../services/find-demo-rounds/find-demo-rounds.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoRoundsController {
  constructor(
    private readonly findDemoRoundsService: FindDemoRoundsService,
  ) {}

  @Get(':id/rounds')
  @ApiOperation({ summary: 'Get all rounds for a demo' })
  findRounds(@Param('id') id: string) {
    return this.findDemoRoundsService.execute(id);
  }
}

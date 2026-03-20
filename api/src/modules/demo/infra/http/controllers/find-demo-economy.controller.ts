import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDemoEconomyService } from '../../../services/find-demo-economy/find-demo-economy.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoEconomyController {
  constructor(
    private readonly findDemoEconomyService: FindDemoEconomyService,
  ) {}

  @Get(':id/economy')
  @ApiOperation({ summary: 'Get economy data per round for a demo' })
  findEconomy(@Param('id') id: string) {
    return this.findDemoEconomyService.execute(id);
  }
}

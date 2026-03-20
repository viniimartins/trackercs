import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindDemoByIdService } from '../../../services/find-demo-by-id/find-demo-by-id.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindDemoByIdController {
  constructor(private readonly findDemoByIdService: FindDemoByIdService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get demo summary by ID' })
  findById(@Param('id') id: string) {
    return this.findDemoByIdService.execute(id);
  }
}

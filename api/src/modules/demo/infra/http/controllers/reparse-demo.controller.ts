import { Controller, Param,Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { ReparseDemoService } from '../../../services/reparse-demo/reparse-demo.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class ReparseDemoController {
  constructor(
    private readonly reparseDemoService: ReparseDemoService,
  ) {}

  @Post(':id/reparse')
  @ApiOperation({ summary: 'Re-parse events for an existing demo' })
  reparse(@Param('id') id: string) {
    return this.reparseDemoService.execute(id);
  }
}

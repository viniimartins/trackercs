import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { ListDemosService } from '../../../services/list-demos/list-demos.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class ListDemosController {
  constructor(private readonly listDemosService: ListDemosService) {}

  @Get()
  @ApiOperation({ summary: 'List all parsed demos' })
  list() {
    return this.listDemosService.execute();
  }
}

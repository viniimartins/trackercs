import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { FindRoundFramesService } from '../../../services/find-round-frames/find-round-frames.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class FindRoundFramesController {
  constructor(
    private readonly findRoundFramesService: FindRoundFramesService,
  ) {}

  @Get(':id/rounds/:roundNumber/frames')
  @ApiOperation({ summary: 'Get frames (player positions) for a specific round' })
  findFrames(
    @Param('id') id: string,
    @Param('roundNumber', ParseIntPipe) roundNumber: number,
  ) {
    return this.findRoundFramesService.execute(id, roundNumber);
  }
}

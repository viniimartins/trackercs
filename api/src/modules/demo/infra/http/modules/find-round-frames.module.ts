import { Module } from '@nestjs/common';

import { FindRoundFramesService } from '../../../services/find-round-frames/find-round-frames.service.js';
import { FindRoundFramesController } from '../controllers/find-round-frames.controller.js';

@Module({
  controllers: [FindRoundFramesController],
  providers: [FindRoundFramesService],
})
export class FindRoundFramesModule {}

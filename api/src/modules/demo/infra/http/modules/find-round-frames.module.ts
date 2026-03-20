import { Module } from '@nestjs/common';

import { FindRoundFramesController } from '../controllers/find-round-frames.controller.js';
import { FindRoundFramesService } from '../../../services/find-round-frames/find-round-frames.service.js';

@Module({
  controllers: [FindRoundFramesController],
  providers: [FindRoundFramesService],
})
export class FindRoundFramesModule {}

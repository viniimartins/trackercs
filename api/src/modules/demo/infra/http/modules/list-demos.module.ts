import { Module } from '@nestjs/common';

import { ListDemosService } from '../../../services/list-demos/list-demos.service.js';
import { ListDemosController } from '../controllers/list-demos.controller.js';

@Module({
  controllers: [ListDemosController],
  providers: [ListDemosService],
})
export class ListDemosModule {}

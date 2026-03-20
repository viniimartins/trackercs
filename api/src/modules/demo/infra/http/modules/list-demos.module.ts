import { Module } from '@nestjs/common';

import { ListDemosController } from '../controllers/list-demos.controller.js';
import { ListDemosService } from '../../../services/list-demos/list-demos.service.js';

@Module({
  controllers: [ListDemosController],
  providers: [ListDemosService],
})
export class ListDemosModule {}

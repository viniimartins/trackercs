import { Module } from '@nestjs/common';

import { FindDemoByIdService } from '../../../services/find-demo-by-id/find-demo-by-id.service.js';
import { FindDemoByIdController } from '../controllers/find-demo-by-id.controller.js';

@Module({
  controllers: [FindDemoByIdController],
  providers: [FindDemoByIdService],
})
export class FindDemoByIdModule {}

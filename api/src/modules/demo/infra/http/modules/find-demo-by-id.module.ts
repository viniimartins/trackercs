import { Module } from '@nestjs/common';

import { FindDemoByIdController } from '../controllers/find-demo-by-id.controller.js';
import { FindDemoByIdService } from '../../../services/find-demo-by-id/find-demo-by-id.service.js';

@Module({
  controllers: [FindDemoByIdController],
  providers: [FindDemoByIdService],
})
export class FindDemoByIdModule {}

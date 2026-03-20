import { Module } from '@nestjs/common';

import { DemoParserProvider } from '../../../providers/demo-parser.provider.js';
import { ReparseDemoService } from '../../../services/reparse-demo/reparse-demo.service.js';
import { ReparseDemoController } from '../controllers/reparse-demo.controller.js';

@Module({
  controllers: [ReparseDemoController],
  providers: [ReparseDemoService, DemoParserProvider],
})
export class ReparseDemoModule {}

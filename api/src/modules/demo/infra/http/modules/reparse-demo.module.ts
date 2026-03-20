import { Module } from '@nestjs/common';

import { ReparseDemoController } from '../controllers/reparse-demo.controller.js';
import { ReparseDemoService } from '../../../services/reparse-demo/reparse-demo.service.js';
import { DemoParserProvider } from '../../../providers/demo-parser.provider.js';

@Module({
  controllers: [ReparseDemoController],
  providers: [ReparseDemoService, DemoParserProvider],
})
export class ReparseDemoModule {}

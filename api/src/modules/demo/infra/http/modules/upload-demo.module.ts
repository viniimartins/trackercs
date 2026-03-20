import { Module } from '@nestjs/common';

import { DemoParserProvider } from '../../../providers/demo-parser.provider.js';
import { UploadDemoService } from '../../../services/upload-demo/upload-demo.service.js';
import { UploadDemoController } from '../controllers/upload-demo.controller.js';

@Module({
  controllers: [UploadDemoController],
  providers: [UploadDemoService, DemoParserProvider],
})
export class UploadDemoModule {}

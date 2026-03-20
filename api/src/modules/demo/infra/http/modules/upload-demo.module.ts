import { Module } from '@nestjs/common';

import { UploadDemoController } from '../controllers/upload-demo.controller.js';
import { UploadDemoService } from '../../../services/upload-demo/upload-demo.service.js';
import { DemoParserProvider } from '../../../providers/demo-parser.provider.js';

@Module({
  controllers: [UploadDemoController],
  providers: [UploadDemoService, DemoParserProvider],
})
export class UploadDemoModule {}

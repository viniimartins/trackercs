import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import multer from 'multer';

import { DEMO_BASE_ROUTE } from '../../../constants/routes.js';
import { UploadDemoService } from '../../../services/upload-demo/upload-demo.service.js';

@ApiTags('Demos')
@Controller(DEMO_BASE_ROUTE)
export class UploadDemoController {
  constructor(private readonly uploadDemoService: UploadDemoService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a .rar or .dem CS2 demo file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 750 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadDemoService.execute(file);
  }
}

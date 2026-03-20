import { Module } from '@nestjs/common';

import { DemoModule } from './modules/demo/demo.module.js';

@Module({
  imports: [DemoModule],
})
export class AppModule {}

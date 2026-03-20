import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoSummaryDto } from '../../dto/demo-summary.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class FindDemoByIdService {
  execute(id: string): DemoSummaryDto {
    const filePath = path.join(DATA_DIR, id, 'summary.json');
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

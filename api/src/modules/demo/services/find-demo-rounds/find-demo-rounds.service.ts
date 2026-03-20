import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoRoundDto } from '../../dto/demo-round.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class FindDemoRoundsService {
  execute(id: string): DemoRoundDto[] {
    const filePath = path.join(DATA_DIR, id, 'rounds.json');
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

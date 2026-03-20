import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoFrameDto } from '../../dto/demo-frame.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class FindRoundFramesService {
  execute(id: string, roundNumber: number): DemoFrameDto[] {
    const filePath = path.join(
      DATA_DIR,
      id,
      'frames',
      `round-${roundNumber}.json`,
    );
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Round ${roundNumber} not found for demo ${id}`,
      );
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

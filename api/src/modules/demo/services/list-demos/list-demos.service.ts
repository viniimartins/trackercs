import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoSummaryDto } from '../../dto/demo-summary.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class ListDemosService {
  execute(): DemoSummaryDto[] {
    if (!fs.existsSync(DATA_DIR)) return [];

    const dirs = fs.readdirSync(DATA_DIR, { withFileTypes: true });
    const demos: DemoSummaryDto[] = [];

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const summaryPath = path.join(DATA_DIR, dir.name, 'summary.json');
      if (!fs.existsSync(summaryPath)) continue;
      demos.push(JSON.parse(fs.readFileSync(summaryPath, 'utf-8')));
    }

    return demos.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

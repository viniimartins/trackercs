import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { EventType } from '../../dto/demo-events.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');
const VALID_TYPES: EventType[] = ['kills', 'damage', 'grenades', 'bomb'];

@Injectable()
export class FindDemoEventsService {
  execute(id: string, type: string) {
    if (!VALID_TYPES.includes(type as EventType)) {
      throw new BadRequestException(
        `Invalid event type "${type}". Valid types: ${VALID_TYPES.join(', ')}`,
      );
    }

    const filePath = path.join(DATA_DIR, id, 'events', `${type}.json`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `Events "${type}" not found for demo ${id}`,
      );
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
}

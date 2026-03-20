import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoRoundDto } from '../../dto/demo-round.dto.js';
import { DemoParserProvider } from '../../providers/demo-parser.provider.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class ReparseDemoService {
  private readonly logger = new Logger(ReparseDemoService.name);

  constructor(private readonly parser: DemoParserProvider) {}

  execute(id: string): { message: string } {
    const demoDir = path.join(DATA_DIR, id);
    if (!fs.existsSync(demoDir)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }

    const roundsPath = path.join(demoDir, 'rounds.json');
    if (!fs.existsSync(roundsPath)) {
      throw new NotFoundException(`Rounds data not found for demo ${id}`);
    }

    // Find the .dem file — check if it was stored, otherwise we can't reparse
    const summaryPath = path.join(demoDir, 'summary.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

    // Look for the original demo buffer in common locations
    const possiblePaths = [
      path.join(demoDir, summary.fileName),
      path.join(demoDir, 'demo.dem'),
    ];

    let demoBuffer: Buffer | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        demoBuffer = fs.readFileSync(p);
        break;
      }
    }

    // If no stored demo file, look for any .dem file in the directory
    if (!demoBuffer) {
      const files = fs.readdirSync(demoDir);
      const demFile = files.find((f) => f.endsWith('.dem'));
      if (demFile) {
        demoBuffer = fs.readFileSync(path.join(demoDir, demFile));
      }
    }

    if (!demoBuffer) {
      throw new NotFoundException(
        `Original .dem file not found for demo ${id}. Reparse requires the demo file to be stored in the demo directory.`,
      );
    }

    const rounds: DemoRoundDto[] = JSON.parse(
      fs.readFileSync(roundsPath, 'utf-8'),
    );

    this.logger.log(`Reparsing events for demo ${id}...`);

    const eventsDir = path.join(demoDir, 'events');
    fs.mkdirSync(eventsDir, { recursive: true });

    const kills = this.parser.parseKillEvents(demoBuffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'kills.json'), JSON.stringify(kills));

    const damage = this.parser.parseDamageEvents(demoBuffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'damage.json'), JSON.stringify(damage));

    const grenades = this.parser.parseGrenadeEvents(demoBuffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'grenades.json'), JSON.stringify(grenades));

    const bomb = this.parser.parseBombEvents(demoBuffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'bomb.json'), JSON.stringify(bomb));

    // Re-generate frames with bomb data
    const framesDir = path.join(demoDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    for (const round of rounds) {
      const roundBombEvents = bomb.filter(
        (e) => e.roundNumber === round.roundNumber,
      );
      const frames = this.parser.parseRoundFrames(
        demoBuffer,
        round.startTick,
        round.endTick,
        roundBombEvents,
      );
      round.totalFrames = frames.length;
      fs.writeFileSync(
        path.join(framesDir, `round-${round.roundNumber}.json`),
        JSON.stringify(frames),
      );
    }

    // Update rounds.json with new totalFrames
    fs.writeFileSync(
      path.join(demoDir, 'rounds.json'),
      JSON.stringify(rounds, null, 2),
    );

    this.logger.log(
      `Reparse complete: ${kills.length} kills, ${damage.length} damage, ${grenades.length} grenades, ${bomb.length} bomb`,
    );

    return {
      message: `Reparsed successfully: ${kills.length} kills, ${damage.length} damage, ${grenades.length} grenades, ${bomb.length} bomb events`,
    };
  }
}

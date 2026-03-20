import { BadRequestException,Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { createExtractorFromData } from 'node-unrar-js';
import * as path from 'path';

import type { BombEventDto } from '../../dto/demo-events.dto.js';
import type { DemoRoundDto } from '../../dto/demo-round.dto.js';
import type { DemoSummaryDto } from '../../dto/demo-summary.dto.js';
import { DemoParserProvider } from '../../providers/demo-parser.provider.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

@Injectable()
export class UploadDemoService {
  private readonly logger = new Logger(UploadDemoService.name);

  constructor(private readonly parser: DemoParserProvider) {}

  async execute(file: Express.Multer.File): Promise<DemoSummaryDto> {
    const demoId = randomUUID();
    const demoDir = path.join(DATA_DIR, demoId);
    const framesDir = path.join(demoDir, 'frames');

    fs.mkdirSync(framesDir, { recursive: true });

    let demoBuffer: Buffer;
    let demoFileName: string;

    if (file.originalname.endsWith('.rar')) {
      this.logger.log('Extracting .rar file...');
      const result = await this.extractRar(file.buffer ?? fs.readFileSync(file.path));
      demoBuffer = result.buffer;
      demoFileName = result.fileName;
    } else if (file.originalname.endsWith('.dem')) {
      demoBuffer = file.buffer ?? fs.readFileSync(file.path);
      demoFileName = file.originalname;
    } else {
      throw new BadRequestException('Only .rar and .dem files are supported');
    }

    fs.writeFileSync(path.join(demoDir, demoFileName), demoBuffer);

    this.logger.log(`Parsing demo: ${demoFileName} (${(demoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

    const summary = this.parser.parseSummary(demoBuffer, demoId, demoFileName);
    fs.writeFileSync(path.join(demoDir, 'summary.json'), JSON.stringify(summary, null, 2));

    const rounds = this.parser.parseRounds(demoBuffer);
    fs.writeFileSync(path.join(demoDir, 'rounds.json'), JSON.stringify(rounds, null, 2));

    this.logger.log('Parsing events...');
    const allBombEvents = this.parseAndSaveEvents(demoBuffer, rounds, demoDir);

    this.logger.log(`Parsing ${rounds.length} rounds...`);
    for (const round of rounds) {
      this.logger.log(`  Round ${round.roundNumber}/${rounds.length}...`);
      const roundBombEvents = allBombEvents.filter(
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

    fs.writeFileSync(path.join(demoDir, 'rounds.json'), JSON.stringify(rounds, null, 2));

    this.logger.log(`Demo parsed successfully: ${demoId}`);
    return summary;
  }

  private parseAndSaveEvents(
    buffer: Buffer,
    rounds: DemoRoundDto[],
    demoDir: string,
  ): BombEventDto[] {
    const eventsDir = path.join(demoDir, 'events');
    fs.mkdirSync(eventsDir, { recursive: true });

    const kills = this.parser.parseKillEvents(buffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'kills.json'), JSON.stringify(kills));
    this.logger.log(`  ${kills.length} kill events`);

    const damage = this.parser.parseDamageEvents(buffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'damage.json'), JSON.stringify(damage));
    this.logger.log(`  ${damage.length} damage events`);

    const grenades = this.parser.parseGrenadeEvents(buffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'grenades.json'), JSON.stringify(grenades));
    this.logger.log(`  ${grenades.length} grenade events`);

    const bomb = this.parser.parseBombEvents(buffer, rounds);
    fs.writeFileSync(path.join(eventsDir, 'bomb.json'), JSON.stringify(bomb));
    this.logger.log(`  ${bomb.length} bomb events`);

    return bomb;
  }

  private async extractRar(
    rarBuffer: Buffer,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const wasmBinary = fs.readFileSync(
      require.resolve('node-unrar-js/dist/js/unrar.wasm'),
    );
    const extractor = await createExtractorFromData({
      data: new Uint8Array(rarBuffer).buffer,
      wasmBinary: new Uint8Array(wasmBinary).buffer,
    });

    const { files } = extractor.extract();

    for (const file of files) {
      if (
        file.fileHeader.name.endsWith('.dem') &&
        file.extraction
      ) {
        const buffer = Buffer.from(file.extraction);
        return { buffer, fileName: path.basename(file.fileHeader.name) };
      }
    }

    throw new BadRequestException('No .dem file found inside .rar');
  }
}

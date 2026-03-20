import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import type { DemoFrameDto } from '../../dto/demo-frame.dto.js';
import type { DemoRoundDto } from '../../dto/demo-round.dto.js';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'demos');

interface RoundEconomy {
  round: number;
  ctMoney: number;
  tMoney: number;
  ctEquip: number;
  tEquip: number;
}

export interface DemoEconomyDto {
  rounds: RoundEconomy[];
}

@Injectable()
export class FindDemoEconomyService {
  execute(id: string): DemoEconomyDto {
    const demoDir = path.join(DATA_DIR, id);
    if (!fs.existsSync(demoDir)) {
      throw new NotFoundException(`Demo ${id} not found`);
    }

    const cachePath = path.join(demoDir, 'economy.json');
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }

    const rounds: DemoRoundDto[] = JSON.parse(
      fs.readFileSync(path.join(demoDir, 'rounds.json'), 'utf-8'),
    );

    const roundEconomies: RoundEconomy[] = [];

    for (const round of rounds) {
      const framePath = path.join(
        demoDir,
        'frames',
        `round_${round.roundNumber}.json`,
      );
      if (!fs.existsSync(framePath)) continue;

      const frames: DemoFrameDto[] = JSON.parse(
        fs.readFileSync(framePath, 'utf-8'),
      );
      if (frames.length === 0) continue;

      const firstFrame = frames[0];
      let ctMoney = 0;
      let tMoney = 0;
      let ctEquip = 0;
      let tEquip = 0;

      for (const player of firstFrame.players) {
        if (player.team === 'CT') {
          ctMoney += player.money;
          ctEquip += player.equipValue;
        } else {
          tMoney += player.money;
          tEquip += player.equipValue;
        }
      }

      roundEconomies.push({
        round: round.roundNumber,
        ctMoney,
        tMoney,
        ctEquip,
        tEquip,
      });
    }

    const result: DemoEconomyDto = { rounds: roundEconomies };
    fs.writeFileSync(cachePath, JSON.stringify(result, null, 2));
    return result;
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class PlayerDto {
  @ApiProperty()
  steamId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['CT', 'T'] })
  team: 'CT' | 'T';
}

export class DemoSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mapName: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  teamCT: string;

  @ApiProperty()
  teamT: string;

  @ApiProperty()
  scoreCT: number;

  @ApiProperty()
  scoreT: number;

  @ApiProperty()
  totalRounds: number;

  @ApiProperty({ type: [PlayerDto] })
  players: PlayerDto[];

  @ApiProperty()
  tickRate: number;

  @ApiProperty()
  createdAt: string;
}

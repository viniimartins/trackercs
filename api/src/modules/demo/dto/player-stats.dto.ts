import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatsDto {
  @ApiProperty()
  steamId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['CT', 'T'] })
  team: 'CT' | 'T';

  @ApiProperty()
  kills: number;

  @ApiProperty()
  deaths: number;

  @ApiProperty()
  assists: number;

  @ApiProperty()
  kd: number;

  @ApiProperty()
  adr: number;

  @ApiProperty()
  hsPercent: number;

  @ApiProperty()
  firstKills: number;

  @ApiProperty()
  firstDeaths: number;

  @ApiProperty()
  utilityDamage: number;

  @ApiProperty()
  tradeKills: number;

  @ApiProperty()
  clutchesWon: number;

  @ApiProperty()
  clutchesTotal: number;

  @ApiProperty()
  kast: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  openingDuelWinRate: number;

  @ApiProperty()
  multiKill2k: number;

  @ApiProperty()
  multiKill3k: number;

  @ApiProperty()
  multiKill4k: number;

  @ApiProperty()
  multiKill5k: number;

  @ApiProperty()
  flashAssists: number;
}

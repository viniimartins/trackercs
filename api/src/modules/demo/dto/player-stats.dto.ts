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
}

import { ApiProperty } from '@nestjs/swagger';

export class DemoRoundDto {
  @ApiProperty()
  roundNumber: number;

  @ApiProperty()
  startTick: number;

  @ApiProperty()
  endTick: number;

  @ApiProperty({ enum: ['ct_win', 't_win'], required: false })
  winner?: 'ct_win' | 't_win';

  @ApiProperty({ required: false })
  winReason?: string;

  @ApiProperty()
  scoreCT: number;

  @ApiProperty()
  scoreT: number;

  @ApiProperty()
  totalFrames: number;
}

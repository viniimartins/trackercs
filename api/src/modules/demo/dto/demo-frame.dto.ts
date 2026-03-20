import { ApiProperty } from '@nestjs/swagger';

export class FramePlayerDto {
  @ApiProperty()
  steamId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['CT', 'T'] })
  team: 'CT' | 'T';

  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty()
  z: number;

  @ApiProperty()
  yaw: number;

  @ApiProperty()
  health: number;

  @ApiProperty()
  armor: number;

  @ApiProperty()
  isAlive: boolean;

  @ApiProperty({ required: false })
  activeWeapon?: string;

  @ApiProperty()
  hasHelmet: boolean;

  @ApiProperty()
  hasDefuser: boolean;

  @ApiProperty()
  money: number;
}

export class BombDto {
  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty()
  z: number;

  @ApiProperty({ enum: ['carried', 'dropped', 'planted', 'defused', 'exploded'] })
  state: 'carried' | 'dropped' | 'planted' | 'defused' | 'exploded';
}

export class DemoFrameDto {
  @ApiProperty()
  tick: number;

  @ApiProperty()
  frameIndex: number;

  @ApiProperty({ type: [FramePlayerDto] })
  players: FramePlayerDto[];

  @ApiProperty({ type: BombDto, required: false })
  bomb?: BombDto;
}

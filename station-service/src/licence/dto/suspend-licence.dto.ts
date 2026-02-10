import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SuspendLicenceDto {
  @ApiProperty({ description: 'Motif de la suspension' })
  @IsString()
  @MinLength(5)
  reason!: string;
}

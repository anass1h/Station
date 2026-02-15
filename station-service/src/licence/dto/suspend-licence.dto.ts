import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';

export class SuspendLicenceDto {
  @ApiProperty({ description: 'Motif de la suspension' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @NoHtml()
  reason!: string;
}

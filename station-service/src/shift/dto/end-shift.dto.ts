import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';

export class EndShiftDto {
  @ApiProperty({
    description: 'Index compteur à la fin du shift (en litres)',
    example: 15250,
  })
  @IsNumber()
  @Min(0)
  indexEnd!: number;

  @ApiPropertyOptional({
    description: 'Note sur les incidents survenus pendant le shift',
    example: 'Panne distributeur de 14h à 14h30',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @NoHtml()
  incidentNote?: string;
}

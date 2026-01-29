import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDispenserDto {
  @ApiPropertyOptional({
    description: 'Référence unique du distributeur dans la station',
    example: 'DC-01',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  reference?: string;
}

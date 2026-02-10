import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ReactivateLicenceDto {
  @ApiProperty({ description: 'Prolongation en mois', default: 6 })
  @IsInt()
  @Min(1)
  extensionMonths!: number;
}

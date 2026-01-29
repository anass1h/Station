import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class StartShiftDto {
  @ApiProperty({
    description: 'ID du pistolet assigné',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  nozzleId!: string;

  @ApiProperty({
    description: 'Index compteur au début du shift (en litres)',
    example: 15000,
  })
  @IsNumber()
  @Min(0)
  indexStart!: number;
}

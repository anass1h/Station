import { IsUUID, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicencePlan } from '@prisma/client';

export class CreateLicenceDto {
  @ApiProperty({ description: 'ID de la station' })
  @IsUUID()
  stationId!: string;

  @ApiProperty({ enum: LicencePlan, description: 'Plan de licence' })
  @IsEnum(LicencePlan)
  plan!: LicencePlan;

  @ApiProperty({ description: 'Durée en mois', minimum: 1 })
  @IsInt()
  @Min(1)
  durationMonths!: number;

  @ApiPropertyOptional({ description: 'Nombre max utilisateurs', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number = 5;

  @ApiPropertyOptional({ description: 'Nombre max distributeurs', default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDispensers?: number = 4;
}

import { IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LicencePlan } from '@prisma/client';

export class CreateLicenceDto {
  @ApiProperty({ description: 'ID de la station' })
  @IsUUID()
  stationId!: string;

  @ApiProperty({ enum: ['BETA'], default: 'BETA' })
  @IsEnum(LicencePlan)
  plan!: LicencePlan;

  @ApiProperty({ description: 'Durée en mois', minimum: 1, default: 12 })
  @IsInt()
  @Min(1)
  durationMonths!: number;
}

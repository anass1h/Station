import { IsEnum, IsInt, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LicencePlan, LicenceStatus } from '@prisma/client';

export class UpdateLicenceDto {
  @ApiPropertyOptional({ enum: LicencePlan, description: 'Plan de licence' })
  @IsOptional()
  @IsEnum(LicencePlan)
  plan?: LicencePlan;

  @ApiPropertyOptional({ enum: LicenceStatus, description: 'Statut de la licence' })
  @IsOptional()
  @IsEnum(LicenceStatus)
  status?: LicenceStatus;

  @ApiPropertyOptional({ description: 'Date de fin de licence' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Nombre max utilisateurs' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @ApiPropertyOptional({ description: 'Nombre max distributeurs' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDispensers?: number;
}

export class ExtendLicenceDto {
  @ApiPropertyOptional({ description: 'Nombre de mois à ajouter', minimum: 1 })
  @IsInt()
  @Min(1)
  months!: number;
}

export class SuspendLicenceDto {
  @ApiPropertyOptional({ description: 'Raison de la suspension' })
  @IsOptional()
  reason?: string;
}

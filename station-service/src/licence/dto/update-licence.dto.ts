import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LicenceStatus } from '@prisma/client';

export class UpdateLicenceDto {
  @ApiPropertyOptional({ enum: LicenceStatus })
  @IsOptional()
  @IsEnum(LicenceStatus)
  status?: LicenceStatus;

  @ApiPropertyOptional({ description: 'Nouvelle date de fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

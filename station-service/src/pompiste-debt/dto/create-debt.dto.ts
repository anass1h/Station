import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { DebtReason } from '@prisma/client';

export class CreateDebtDto {
  @IsUUID()
  pompisteId!: string;

  @IsUUID()
  stationId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(DebtReason)
  reason!: DebtReason;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}

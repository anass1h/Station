import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { NoHtml } from '../../common/validators/index.js';
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
  @MaxLength(500)
  @NoHtml()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  relatedEntityId?: string;

  @IsOptional()
  @IsIn(['Shift', 'CashRegister', 'Sale'])
  relatedEntityType?: string;
}

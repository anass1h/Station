import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { SafeText } from '../../common/validators/index.js';

export class AddDebtPaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsIn(['CASH', 'SALARY_DEDUCTION', 'BANK_TRANSFER', 'OTHER'])
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SafeText()
  note?: string;

  @IsDateString()
  paymentDate!: string;
}

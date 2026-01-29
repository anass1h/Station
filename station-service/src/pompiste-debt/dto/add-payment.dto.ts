import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class AddDebtPaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  paymentMethod!: string; // "CASH", "SALARY_DEDUCTION", "OTHER"

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  paymentDate!: string;
}

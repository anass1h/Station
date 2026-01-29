import { Module } from '@nestjs/common';
import { ShiftValidator, SaleValidator, StockValidator } from './validators/index.js';
import {
  PriceCalculator,
  MarginCalculator,
  ShiftCalculator,
  StockCalculator,
} from './calculators/index.js';

@Module({
  providers: [
    // Validators
    ShiftValidator,
    SaleValidator,
    StockValidator,
    // Calculators
    PriceCalculator,
    MarginCalculator,
    ShiftCalculator,
    StockCalculator,
  ],
  exports: [
    // Validators
    ShiftValidator,
    SaleValidator,
    StockValidator,
    // Calculators
    PriceCalculator,
    MarginCalculator,
    ShiftCalculator,
    StockCalculator,
  ],
})
export class CommonModule {}

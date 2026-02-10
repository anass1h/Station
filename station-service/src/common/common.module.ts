import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/index.js';

// Validators
import { ShiftValidator } from './validators/shift.validator.js';
import { SaleValidator } from './validators/sale.validator.js';
import { StockValidator } from './validators/stock.validator.js';

// Calculators
import { PriceCalculator } from './calculators/price.calculator.js';
import { MarginCalculator } from './calculators/margin.calculator.js';
import { ShiftCalculator } from './calculators/shift.calculator.js';
import { StockCalculator } from './calculators/stock.calculator.js';

// Services
import { StockAtomicService } from './services/stock-atomic.service.js';

const validators = [ShiftValidator, SaleValidator, StockValidator];
const calculators = [
  PriceCalculator,
  MarginCalculator,
  ShiftCalculator,
  StockCalculator,
];
const services = [StockAtomicService];

@Global()
@Module({
  imports: [PrismaModule],
  providers: [...validators, ...calculators, ...services],
  exports: [...validators, ...calculators, ...services],
})
export class CommonModule {}

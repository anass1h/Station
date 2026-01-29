import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller.js';
import { SaleService } from './sale.service.js';
import { CommonModule } from '../common/index.js';

@Module({
  imports: [CommonModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}

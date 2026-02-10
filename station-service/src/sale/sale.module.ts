import { Module } from '@nestjs/common';
import { SaleController } from './sale.controller.js';
import { SaleService } from './sale.service.js';
import { CommonModule } from '../common/index.js';
import { AlertModule } from '../alert/alert.module.js';

@Module({
  imports: [CommonModule, AlertModule],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}

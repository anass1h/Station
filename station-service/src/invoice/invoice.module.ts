import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller.js';
import { InvoiceService } from './invoice.service.js';
import { InvoicePdfService } from './pdf/index.js';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoicePdfService],
  exports: [InvoiceService, InvoicePdfService],
})
export class InvoiceModule {}

import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';
import { CommonModule } from '../common/index.js';

@Module({
  imports: [CommonModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}

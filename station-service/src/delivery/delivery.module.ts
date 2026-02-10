import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';
import { CommonModule } from '../common/index.js';
import { AlertModule } from '../alert/alert.module.js';

@Module({
  imports: [CommonModule, AlertModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}

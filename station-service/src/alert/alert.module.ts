import { Module } from '@nestjs/common';
import { AlertController } from './alert.controller.js';
import { AlertService } from './alert.service.js';
import { AlertTriggerService } from './alert-trigger.service.js';

@Module({
  controllers: [AlertController],
  providers: [AlertService, AlertTriggerService],
  exports: [AlertService, AlertTriggerService],
})
export class AlertModule {}

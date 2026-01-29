import { Module } from '@nestjs/common';
import { DispenserController } from './dispenser.controller.js';
import { DispenserService } from './dispenser.service.js';

@Module({
  controllers: [DispenserController],
  providers: [DispenserService],
  exports: [DispenserService],
})
export class DispenserModule {}

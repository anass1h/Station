import { Module } from '@nestjs/common';
import { TankController } from './tank.controller.js';
import { TankService } from './tank.service.js';

@Module({
  controllers: [TankController],
  providers: [TankService],
  exports: [TankService],
})
export class TankModule {}

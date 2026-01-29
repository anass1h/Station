import { Module } from '@nestjs/common';
import { NozzleController } from './nozzle.controller.js';
import { NozzleService } from './nozzle.service.js';

@Module({
  controllers: [NozzleController],
  providers: [NozzleService],
  exports: [NozzleService],
})
export class NozzleModule {}

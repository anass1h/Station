import { Module } from '@nestjs/common';
import { StationController } from './station.controller.js';
import { StationService } from './station.service.js';

@Module({
  controllers: [StationController],
  providers: [StationService],
  exports: [StationService],
})
export class StationModule {}

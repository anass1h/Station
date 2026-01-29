import { Module } from '@nestjs/common';
import { FuelTypeController } from './fuel-type.controller.js';
import { FuelTypeService } from './fuel-type.service.js';

@Module({
  controllers: [FuelTypeController],
  providers: [FuelTypeService],
  exports: [FuelTypeService],
})
export class FuelTypeModule {}

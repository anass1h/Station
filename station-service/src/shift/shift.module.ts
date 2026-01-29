import { Module } from '@nestjs/common';
import { ShiftController } from './shift.controller.js';
import { ShiftService } from './shift.service.js';
import { CommonModule } from '../common/index.js';

@Module({
  imports: [CommonModule],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService],
})
export class ShiftModule {}

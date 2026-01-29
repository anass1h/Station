import { Module, forwardRef } from '@nestjs/common';
import { CashRegisterController } from './cash-register.controller.js';
import { CashRegisterService } from './cash-register.service.js';
import { PompisteDebtModule } from '../pompiste-debt/index.js';

@Module({
  imports: [forwardRef(() => PompisteDebtModule)],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}

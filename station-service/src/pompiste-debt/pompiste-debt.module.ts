import { Module } from '@nestjs/common';
import { PompisteDebtService } from './pompiste-debt.service';
import { PompisteDebtController } from './pompiste-debt.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PompisteDebtController],
  providers: [PompisteDebtService],
  exports: [PompisteDebtService],
})
export class PompisteDebtModule {}

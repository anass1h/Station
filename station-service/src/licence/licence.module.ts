import { Module, Global } from '@nestjs/common';
import { LicenceService } from './licence.service';
import { LicenceController } from './licence.controller';
import { LicenceGuard } from './licence.guard';
import { PrismaModule } from '../prisma/index.js';
import { AuditLogModule } from '../audit-log/index.js';

@Global()
@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [LicenceController],
  providers: [LicenceService, LicenceGuard],
  exports: [LicenceService, LicenceGuard],
})
export class LicenceModule {}

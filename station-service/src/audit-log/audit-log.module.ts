import { Global, Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditInterceptor } from './audit.interceptor.js';

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditInterceptor],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditLogModule {}

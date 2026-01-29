import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditAction } from './dto/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    stationId?: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method;

    // Ne traiter que POST, PATCH, PUT, DELETE
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Ignorer les routes d'auth et de health
    const path = request.path;
    if (
      path.includes('/auth/') ||
      path.includes('/health') ||
      path.includes('/audit-logs')
    ) {
      return next.handle();
    }

    const userId = request.user?.id;
    const stationId = request.user?.stationId;
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'];

    const { entityType, entityId } = this.extractEntityInfo(path);
    const action = this.methodToAction(method);

    // Pour UPDATE/DELETE, récupérer l'ancienne valeur
    let oldValue: Prisma.InputJsonValue | null = null;
    if ((action === AuditAction.UPDATE || action === AuditAction.DELETE) && entityId) {
      oldValue = await this.fetchOldValue(entityType, entityId);
    }

    return next.handle().pipe(
      tap({
        next: async (response) => {
          // Log l'action après succès
          try {
            await this.auditLogService.log({
              userId,
              stationId,
              action,
              entityType,
              entityId: entityId || this.extractIdFromResponse(response),
              oldValue,
              newValue: this.sanitizeResponse(response),
              ipAddress,
              userAgent,
            });
          } catch (error) {
            // Ne pas bloquer la requête si le log échoue
            console.error('Audit log failed:', error);
          }
        },
      }),
    );
  }

  private getIpAddress(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private methodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.UPDATE;
    }
  }

  private extractEntityInfo(path: string): { entityType: string; entityId?: string } {
    // Parse path like /api/v1/stations/uuid or /stations/uuid/action
    const segments = path.split('/').filter(Boolean);

    // Map route segments to entity types
    const entityMap: Record<string, string> = {
      stations: 'Station',
      'fuel-types': 'FuelType',
      tanks: 'Tank',
      dispensers: 'Dispenser',
      nozzles: 'Nozzle',
      shifts: 'Shift',
      sales: 'Sale',
      'cash-registers': 'CashRegister',
      suppliers: 'Supplier',
      deliveries: 'Delivery',
      clients: 'Client',
      invoices: 'Invoice',
      prices: 'Price',
      'payment-methods': 'PaymentMethod',
      alerts: 'Alert',
      users: 'User',
    };

    let entityType = 'Unknown';
    let entityId: string | undefined;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (entityMap[segment]) {
        entityType = entityMap[segment];
        // Check if next segment is a UUID
        const nextSegment = segments[i + 1];
        if (nextSegment && this.isUUID(nextSegment)) {
          entityId = nextSegment;
        }
        break;
      }
    }

    return { entityType, entityId };
  }

  private isUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private async fetchOldValue(
    entityType: string,
    entityId: string,
  ): Promise<Prisma.InputJsonValue | null> {
    try {
      const modelName = entityType.charAt(0).toLowerCase() + entityType.slice(1);
      const prismaAny = this.prisma as unknown as Record<string, unknown>;
      const model = prismaAny[modelName];

      if (model && typeof model === 'object' && 'findUnique' in model) {
        const findUnique = (model as { findUnique: (args: { where: { id: string } }) => Promise<unknown> }).findUnique;
        const result = await findUnique({ where: { id: entityId } });
        return result as Prisma.InputJsonValue | null;
      }
    } catch {
      // Entity not found or model doesn't exist
    }
    return null;
  }

  private extractIdFromResponse(response: unknown): string | undefined {
    if (response && typeof response === 'object' && 'id' in response) {
      return (response as { id: string }).id;
    }
    return undefined;
  }

  private sanitizeResponse(response: unknown): Prisma.InputJsonValue | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    // Remove sensitive fields
    const sensitiveFields = ['passwordHash', 'pinCodeHash', 'token', 'accessToken'];
    const sanitized = { ...response } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized as Prisma.InputJsonValue;
  }
}

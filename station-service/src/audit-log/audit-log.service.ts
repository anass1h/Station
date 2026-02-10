import { Injectable, Logger } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { AuditAction, QueryAuditLogDto } from './dto/index.js';

export interface LogData {
  userId?: string | null;
  stationId?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  oldValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: LogData): Promise<AuditLog> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        stationId: data.stationId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue ?? undefined,
        newValue: data.newValue ?? undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    this.logger.debug(
      `[AUDIT] ${data.action} ${data.entityType}${data.entityId ? `:${data.entityId}` : ''} by user ${data.userId || 'SYSTEM'}`,
    );

    return auditLog;
  }

  async findAll(query: QueryAuditLogDto): Promise<PaginatedResult<AuditLog>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.stationId && { stationId: query.stationId }),
      ...(query.userId && { userId: query.userId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.action && { action: query.action }),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && { gte: new Date(query.from) }),
              ...(query.to && { lte: new Date(query.to) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          station: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        ...(from || to
          ? {
              createdAt: {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
              },
            }
          : {}),
      },
      include: {
        station: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    stationId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      stationId,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    stationId?: string,
  ): Promise<void> {
    await this.log({
      userId,
      stationId,
      action: AuditAction.LOGOUT,
      entityType: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async logLoginFailed(
    identifier: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.LOGIN_FAILED,
      entityType: 'User',
      newValue: { identifier },
      ipAddress,
      userAgent,
    });
  }
}

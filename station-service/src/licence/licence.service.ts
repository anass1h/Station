import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Licence, LicencePlan, LicenceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { AuditLogService } from '../audit-log/index.js';
import { getPlanConfig } from './licence-plans.config.js';
import { CreateLicenceDto } from './dto/create-licence.dto.js';
import { SuspendLicenceDto } from './dto/suspend-licence.dto.js';
import { ReactivateLicenceDto } from './dto/reactivate-licence.dto.js';
import { ExtendLicenceDto } from './dto/extend-licence.dto.js';

export interface LicenceCheckResult {
  valid: boolean;
  reason?: string;
  daysRemaining?: number;
  licence?: Licence;
}

@Injectable()
export class LicenceService {
  private readonly logger = new Logger(LicenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getPlanDefaults(plan: LicencePlan) {
    const config = getPlanConfig(plan);
    return {
      maxUsers: config.maxUsers,
      maxDispensers: config.maxDispensers,
      maxTanks: config.maxTanks,
      maxStations: config.maxStations,
      features: config.features as unknown as Prisma.InputJsonValue,
      gracePeriodDays: config.gracePeriodDays,
    };
  }

  // ═══════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════

  async create(dto: CreateLicenceDto): Promise<Licence> {
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });
    if (!station) {
      throw new NotFoundException(`Station ${dto.stationId} non trouvée`);
    }

    const existing = await this.prisma.licence.findUnique({
      where: { stationId: dto.stationId },
    });
    if (existing) {
      throw new ConflictException('Une licence existe déjà pour cette station');
    }

    const defaults = this.getPlanDefaults(dto.plan);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + dto.durationMonths);

    const licence = await this.prisma.licence.create({
      data: {
        stationId: dto.stationId,
        plan: dto.plan,
        status: LicenceStatus.ACTIVE,
        startDate,
        endDate,
        ...defaults,
      },
    });

    await this.auditLogService.log({
      stationId: dto.stationId,
      action: 'CREATE',
      entityType: 'Licence',
      entityId: licence.id,
      newValue: {
        plan: dto.plan,
        endDate: endDate.toISOString(),
      } as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(
      `Licence BETA créée pour station ${dto.stationId}, expire le ${endDate.toISOString()}`,
    );
    return licence;
  }

  // ═══════════════════════════════════════
  // LECTURE — SUPER ADMIN
  // ═══════════════════════════════════════

  async findAll(): Promise<any[]> {
    return this.prisma.licence.findMany({
      include: {
        station: {
          select: {
            id: true,
            name: true,
            city: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            _count: {
              select: {
                users: {
                  where: { isActive: true, role: { not: 'SUPER_ADMIN' } },
                },
                dispensers: { where: { isActive: true } },
                tanks: { where: { isActive: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findDetailByStation(stationId: string): Promise<any> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
      include: {
        station: {
          include: {
            _count: {
              select: {
                users: {
                  where: { isActive: true, role: { not: 'SUPER_ADMIN' } },
                },
                dispensers: { where: { isActive: true } },
                tanks: { where: { isActive: true } },
              },
            },
          },
        },
      },
    });

    if (!licence) {
      throw new NotFoundException(
        `Aucune licence pour la station ${stationId}`,
      );
    }

    const daysRemaining = Math.max(
      0,
      Math.ceil((licence.endDate.getTime() - Date.now()) / 86400000),
    );

    return {
      ...licence,
      daysRemaining,
      usage: {
        users: {
          current: licence.station._count.users,
          max: licence.maxUsers,
        },
        dispensers: {
          current: licence.station._count.dispensers,
          max: licence.maxDispensers,
        },
        tanks: {
          current: licence.station._count.tanks,
          max: licence.maxTanks,
        },
      },
    };
  }

  async findByStation(stationId: string): Promise<Licence | null> {
    return this.prisma.licence.findUnique({
      where: { stationId },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });
  }

  // ═══════════════════════════════════════
  // VÉRIFICATION LICENCE
  // ═══════════════════════════════════════

  async checkLicence(stationId: string): Promise<LicenceCheckResult> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });

    if (!licence) {
      return {
        valid: false,
        reason: 'Aucune licence trouvée pour cette station',
      };
    }

    // Mettre à jour lastCheckedAt
    await this.prisma.licence.update({
      where: { id: licence.id },
      data: { lastCheckedAt: new Date() },
    });

    // Vérifier le statut
    if (licence.status !== LicenceStatus.ACTIVE) {
      return {
        valid: false,
        reason: `Licence ${licence.status.toLowerCase()}`,
        licence,
      };
    }

    // Vérifier l'expiration
    const now = new Date();
    if (licence.endDate < now) {
      await this.prisma.licence.update({
        where: { id: licence.id },
        data: { status: LicenceStatus.EXPIRED },
      });

      return {
        valid: false,
        reason: 'Licence expirée',
        licence,
      };
    }

    const daysRemaining = Math.ceil(
      (licence.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      valid: true,
      daysRemaining,
      licence,
    };
  }

  // ═══════════════════════════════════════
  // ACTIONS SUPER ADMIN
  // ═══════════════════════════════════════

  async suspend(
    stationId: string,
    dto: SuspendLicenceDto,
    adminUserId: string,
  ): Promise<Licence> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });
    if (!licence) {
      throw new NotFoundException(
        `Aucune licence pour station ${stationId}`,
      );
    }
    if (licence.status === LicenceStatus.SUSPENDED) {
      throw new ConflictException('Déjà suspendue');
    }

    const updated = await this.prisma.licence.update({
      where: { stationId },
      data: { status: LicenceStatus.SUSPENDED },
    });

    await this.auditLogService.log({
      stationId,
      userId: adminUserId,
      action: 'SUSPEND_LICENCE',
      entityType: 'Licence',
      entityId: licence.id,
      oldValue: { status: licence.status } as unknown as Prisma.InputJsonValue,
      newValue: {
        status: 'SUSPENDED',
        reason: dto.reason,
      } as unknown as Prisma.InputJsonValue,
    });

    this.logger.warn(
      `Licence suspendue — station ${stationId} — motif : ${dto.reason}`,
    );
    return updated;
  }

  async reactivate(
    stationId: string,
    dto: ReactivateLicenceDto,
    adminUserId: string,
  ): Promise<Licence> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });
    if (!licence) {
      throw new NotFoundException(
        `Aucune licence pour station ${stationId}`,
      );
    }
    if (licence.status === LicenceStatus.ACTIVE) {
      throw new ConflictException('Déjà active');
    }

    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + dto.extensionMonths);

    const updated = await this.prisma.licence.update({
      where: { stationId },
      data: {
        status: LicenceStatus.ACTIVE,
        endDate: newEndDate,
        startDate: new Date(),
      },
    });

    await this.auditLogService.log({
      stationId,
      userId: adminUserId,
      action: 'REACTIVATE_LICENCE',
      entityType: 'Licence',
      entityId: licence.id,
      oldValue: {
        status: licence.status,
        endDate: licence.endDate,
      } as unknown as Prisma.InputJsonValue,
      newValue: {
        status: 'ACTIVE',
        endDate: newEndDate,
      } as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(
      `Licence réactivée — station ${stationId} — +${dto.extensionMonths} mois`,
    );
    return updated;
  }

  async extend(
    stationId: string,
    dto: ExtendLicenceDto,
    adminUserId: string,
  ): Promise<Licence> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });
    if (!licence) {
      throw new NotFoundException(
        `Aucune licence pour station ${stationId}`,
      );
    }

    const newEndDate = new Date(licence.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + dto.months);

    const updated = await this.prisma.licence.update({
      where: { stationId },
      data: { endDate: newEndDate },
    });

    await this.auditLogService.log({
      stationId,
      userId: adminUserId,
      action: 'EXTEND_LICENCE',
      entityType: 'Licence',
      entityId: licence.id,
      oldValue: {
        endDate: licence.endDate,
      } as unknown as Prisma.InputJsonValue,
      newValue: {
        endDate: newEndDate,
        monthsAdded: dto.months,
      } as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(
      `Licence prolongée — station ${stationId} — +${dto.months} mois`,
    );
    return updated;
  }

  // ═══════════════════════════════════════
  // STATS ADMIN
  // ═══════════════════════════════════════

  async getAdminStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    suspended: number;
    expiringSoon: number;
  }> {
    const [total, active, expired, suspended] = await Promise.all([
      this.prisma.licence.count(),
      this.prisma.licence.count({ where: { status: LicenceStatus.ACTIVE } }),
      this.prisma.licence.count({ where: { status: LicenceStatus.EXPIRED } }),
      this.prisma.licence.count({
        where: { status: LicenceStatus.SUSPENDED },
      }),
    ]);

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const expiringSoon = await this.prisma.licence.count({
      where: {
        status: LicenceStatus.ACTIVE,
        endDate: { lte: sevenDays, gte: new Date() },
      },
    });

    return { total, active, expired, suspended, expiringSoon };
  }

  // ═══════════════════════════════════════
  // QUOTAS
  // ═══════════════════════════════════════

  async checkStationQuota(): Promise<void> {
    const activeStations = await this.prisma.station.count({
      where: { isActive: true },
    });

    const licenceWithMaxStations = await this.prisma.licence.findFirst({
      where: { status: LicenceStatus.ACTIVE },
      orderBy: { maxStations: 'desc' },
      select: { maxStations: true, plan: true },
    });

    if (!licenceWithMaxStations) {
      return;
    }

    if (activeStations >= licenceWithMaxStations.maxStations) {
      throw new ForbiddenException(
        `Limite de stations atteinte : maximum ${licenceWithMaxStations.maxStations} stations ` +
          `(plan ${licenceWithMaxStations.plan}). Actuellement ${activeStations} stations actives.`,
      );
    }
  }

  async checkQuota(
    stationId: string,
    resource: 'users' | 'dispensers' | 'tanks',
  ): Promise<void> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });

    if (!licence || licence.status !== LicenceStatus.ACTIVE) {
      return;
    }

    let current = 0;
    let max = 0;
    let label = '';

    switch (resource) {
      case 'users':
        current = await this.prisma.user.count({
          where: {
            stationId,
            isActive: true,
            role: { not: 'SUPER_ADMIN' },
          },
        });
        max = licence.maxUsers;
        label = 'utilisateurs';
        break;
      case 'dispensers':
        current = await this.prisma.dispenser.count({
          where: { stationId, isActive: true },
        });
        max = licence.maxDispensers;
        label = 'distributeurs';
        break;
      case 'tanks':
        current = await this.prisma.tank.count({
          where: { stationId, isActive: true },
        });
        max = licence.maxTanks;
        label = 'cuves';
        break;
    }

    if (current >= max) {
      throw new ForbiddenException(
        `Limite de ${label} atteinte : maximum ${max} (plan ${licence.plan}). Actuellement ${current}.`,
      );
    }
  }

  async checkFeature(
    stationId: string,
    feature: string,
  ): Promise<boolean> {
    const licence = await this.prisma.licence.findUnique({
      where: { stationId },
    });

    if (!licence || licence.status !== LicenceStatus.ACTIVE) {
      return false;
    }

    const features = licence.features as Record<string, boolean>;
    return features[feature] === true;
  }

  // ═══════════════════════════════════════
  // EXPIRATION PROCESSING (CRON)
  // ═══════════════════════════════════════

  async getExpiringLicences(days: number = 7): Promise<Licence[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.licence.findMany({
      where: {
        status: LicenceStatus.ACTIVE,
        endDate: { gte: now, lte: futureDate },
      },
      include: {
        station: {
          select: { id: true, name: true, city: true, email: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async getExpiredLicences(): Promise<Licence[]> {
    return this.prisma.licence.findMany({
      where: {
        status: LicenceStatus.ACTIVE,
        endDate: { lt: new Date() },
      },
      include: {
        station: {
          select: { id: true, name: true, city: true, email: true },
        },
      },
    });
  }

  async processExpiredLicences(): Promise<number> {
    const expiredLicences = await this.getExpiredLicences();

    if (expiredLicences.length === 0) {
      return 0;
    }

    const result = await this.prisma.licence.updateMany({
      where: {
        id: { in: expiredLicences.map((l) => l.id) },
      },
      data: { status: LicenceStatus.EXPIRED },
    });

    this.logger.warn(`${result.count} licences marquées comme expirées`);
    return result.count;
  }
}

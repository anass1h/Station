import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Licence, LicenceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { AuditLogService } from '../audit-log/index.js';
import { CreateLicenceDto, UpdateLicenceDto } from './dto';

export interface LicenceCheckResult {
  valid: boolean;
  reason?: string;
  daysRemaining?: number;
  licence?: Licence;
}

interface LicenceFeatures {
  invoicing?: boolean;
  reports?: boolean;
  multiStation?: boolean;
  api?: boolean;
  support?: string;
}

@Injectable()
export class LicenceService {
  private readonly logger = new Logger(LicenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getDefaultFeatures(plan: string): Prisma.InputJsonValue {
    const features: Record<string, LicenceFeatures> = {
      TRIAL: {
        invoicing: true,
        reports: false,
        multiStation: false,
        api: false,
        support: 'email',
      },
      BASIC: {
        invoicing: true,
        reports: true,
        multiStation: false,
        api: false,
        support: 'email',
      },
      PREMIUM: {
        invoicing: true,
        reports: true,
        multiStation: true,
        api: true,
        support: 'priority',
      },
      ENTERPRISE: {
        invoicing: true,
        reports: true,
        multiStation: true,
        api: true,
        support: '24/7',
      },
    };
    return (features[plan] || features.TRIAL) as Prisma.InputJsonValue;
  }

  async create(dto: CreateLicenceDto): Promise<Licence> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Vérifier qu'il n'y a pas déjà une licence pour cette station
    const existingLicence = await this.prisma.licence.findUnique({
      where: { stationId: dto.stationId },
    });

    if (existingLicence) {
      throw new ConflictException('Une licence existe déjà pour cette station');
    }

    // Calculer les dates
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
        maxUsers: dto.maxUsers ?? 5,
        maxDispensers: dto.maxDispensers ?? 4,
        features: this.getDefaultFeatures(dto.plan),
      },
    });

    this.logger.log(
      `Licence ${dto.plan} créée pour station ${dto.stationId}, expire le ${endDate.toISOString()}`,
    );

    return licence;
  }

  async findAll(): Promise<Licence[]> {
    return this.prisma.licence.findMany({
      include: {
        station: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Licence> {
    const licence = await this.prisma.licence.findUnique({
      where: { id },
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

    if (!licence) {
      throw new NotFoundException(`Licence avec l'ID ${id} non trouvée`);
    }

    return licence;
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
      // Marquer comme expirée automatiquement
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

    // Calculer jours restants
    const daysRemaining = Math.ceil(
      (licence.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      valid: true,
      daysRemaining,
      licence,
    };
  }

  async update(id: string, dto: UpdateLicenceDto): Promise<Licence> {
    const licence = await this.findById(id);

    const updateData: Record<string, unknown> = {};

    if (dto.plan !== undefined) {
      updateData.plan = dto.plan;
      updateData.features = this.getDefaultFeatures(dto.plan);
    }
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.maxUsers !== undefined) updateData.maxUsers = dto.maxUsers;
    if (dto.maxDispensers !== undefined)
      updateData.maxDispensers = dto.maxDispensers;

    return this.prisma.licence.update({
      where: { id: licence.id },
      data: updateData,
    });
  }

  async suspend(
    id: string,
    reason?: string,
    userId?: string,
    stationId?: string,
  ): Promise<Licence> {
    const licence = await this.findById(id);

    const updatedLicence = await this.prisma.licence.update({
      where: { id: licence.id },
      data: { status: LicenceStatus.SUSPENDED },
    });

    // Log dans AuditLog
    await this.auditLogService.log({
      userId,
      stationId,
      action: 'SUSPEND',
      entityType: 'Licence',
      entityId: licence.id,
      oldValue: { status: licence.status },
      newValue: { status: LicenceStatus.SUSPENDED, reason },
    });

    this.logger.warn(
      `Licence ${licence.id} suspendue pour station ${licence.stationId}. Raison: ${reason || 'Non spécifiée'}`,
    );

    return updatedLicence;
  }

  async reactivate(id: string): Promise<Licence> {
    const licence = await this.findById(id);

    if (licence.status === LicenceStatus.ACTIVE) {
      throw new ConflictException('La licence est déjà active');
    }

    // Vérifier si la licence n'est pas expirée
    if (licence.endDate < new Date()) {
      throw new ConflictException(
        "Impossible de réactiver une licence expirée. Veuillez la prolonger d'abord.",
      );
    }

    const updatedLicence = await this.prisma.licence.update({
      where: { id: licence.id },
      data: { status: LicenceStatus.ACTIVE },
    });

    this.logger.log(
      `Licence ${licence.id} réactivée pour station ${licence.stationId}`,
    );

    return updatedLicence;
  }

  async extend(id: string, months: number): Promise<Licence> {
    const licence = await this.findById(id);

    const newEndDate = new Date(licence.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    // Si la licence était expirée, la réactiver
    const status =
      licence.status === LicenceStatus.EXPIRED
        ? LicenceStatus.ACTIVE
        : licence.status;

    const updatedLicence = await this.prisma.licence.update({
      where: { id: licence.id },
      data: {
        endDate: newEndDate,
        status,
      },
    });

    this.logger.log(
      `Licence ${licence.id} prolongée de ${months} mois, nouvelle fin: ${newEndDate.toISOString()}`,
    );

    return updatedLicence;
  }

  async getExpiringLicences(days: number = 7): Promise<Licence[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.licence.findMany({
      where: {
        status: LicenceStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            city: true,
            email: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async getExpiredLicences(): Promise<Licence[]> {
    const now = new Date();

    return this.prisma.licence.findMany({
      where: {
        status: LicenceStatus.ACTIVE,
        endDate: {
          lt: now,
        },
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            city: true,
            email: true,
          },
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
        id: {
          in: expiredLicences.map((l) => l.id),
        },
      },
      data: {
        status: LicenceStatus.EXPIRED,
      },
    });

    this.logger.warn(`${result.count} licences marquées comme expirées`);

    return result.count;
  }
}

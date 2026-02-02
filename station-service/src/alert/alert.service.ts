import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Alert, AlertPriority, AlertStatus, AlertType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateAlertDto } from './dto/index.js';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlertDto): Promise<Alert> {
    const alert = await this.prisma.alert.create({
      data: {
        stationId: dto.stationId,
        alertType: dto.alertType,
        priority: dto.priority,
        status: AlertStatus.ACTIVE,
        title: dto.title,
        message: dto.message,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        triggeredAt: new Date(),
      },
      include: {
        station: true,
      },
    });

    this.logger.warn(
      `[${dto.priority}] Alerte créée: ${dto.title} (Station: ${alert.station.name})`,
    );

    return alert;
  }

  async findAll(
    stationId?: string,
    status?: AlertStatus,
    priority?: AlertPriority,
  ): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: {
        ...(stationId && { stationId }),
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: {
        station: {
          select: { id: true, name: true },
        },
        acknowledgedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { triggeredAt: 'desc' },
      ],
    });
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        station: true,
        acknowledgedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        resolvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alerte avec l'ID ${id} non trouvée`);
    }

    return alert;
  }

  async countActive(stationId?: string): Promise<number> {
    return this.prisma.alert.count({
      where: {
        status: AlertStatus.ACTIVE,
        ...(stationId && { stationId }),
      },
    });
  }

  async acknowledge(id: string, userId: string): Promise<Alert> {
    await this.findOne(id);

    // Verify user exists before updating
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    try {
      const alert = await this.prisma.alert.update({
        where: { id },
        data: {
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedByUserId: userId,
          acknowledgedAt: new Date(),
        },
        include: {
          station: true,
          acknowledgedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      this.logger.log(`Alerte acquittée: ${alert.title} par utilisateur ${userId}`);

      return alert;
    } catch (error) {
      this.logger.error(`Erreur lors de l'acquittement de l'alerte ${id}: ${error}`);
      throw new BadRequestException(`Impossible d'acquitter l'alerte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async resolve(id: string, userId: string): Promise<Alert> {
    await this.findOne(id);

    // Verify user exists before updating
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    try {
      const alert = await this.prisma.alert.update({
        where: { id },
        data: {
          status: AlertStatus.RESOLVED,
          resolvedByUserId: userId,
          resolvedAt: new Date(),
        },
        include: {
          station: true,
          resolvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      this.logger.log(`Alerte résolue: ${alert.title} par utilisateur ${userId}`);

      return alert;
    } catch (error) {
      this.logger.error(`Erreur lors de la résolution de l'alerte ${id}: ${error}`);
      throw new BadRequestException(`Impossible de résoudre l'alerte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async ignore(id: string): Promise<Alert> {
    await this.findOne(id);

    const alert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.IGNORED,
      },
      include: {
        station: true,
      },
    });

    this.logger.log(`Alerte ignorée: ${alert.title}`);

    return alert;
  }

  async hasActiveAlert(
    stationId: string,
    alertType: AlertType,
    relatedEntityId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.alert.count({
      where: {
        stationId,
        alertType,
        status: AlertStatus.ACTIVE,
        ...(relatedEntityId && { relatedEntityId }),
      },
    });

    return count > 0;
  }

  async autoResolveByEntity(
    stationId: string,
    alertType: AlertType,
    relatedEntityId: string,
  ): Promise<void> {
    const result = await this.prisma.alert.updateMany({
      where: {
        stationId,
        alertType,
        relatedEntityId,
        status: { in: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED] },
      },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `${result.count} alerte(s) ${alertType} auto-résolue(s) pour entité ${relatedEntityId}`,
      );
    }
  }
}

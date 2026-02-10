import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Station } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { LicenceService } from '../licence/licence.service.js';
import { CreateStationDto, UpdateStationDto } from './dto/index.js';

@Injectable()
export class StationService {
  private readonly logger = new Logger(StationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly licenceService: LicenceService,
  ) {}

  async create(dto: CreateStationDto): Promise<Station> {
    await this.licenceService.checkStationQuota();

    return this.prisma.station.create({
      data: dto,
    });
  }

  async findAll(stationId?: string | null): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: {
        isActive: true,
        ...(stationId && { id: stationId }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(
    id: string,
    userStationId?: string | null,
    includeInactive = false,
  ): Promise<Station> {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        users: {
          where: { isActive: true },
        },
        tanks: {
          where: { isActive: true },
        },
        dispensers: {
          where: { isActive: true },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Station avec l'ID ${id} non trouvée`);
    }

    // Masquer les stations désactivées sauf demande explicite
    if (!station.isActive && !includeInactive) {
      throw new NotFoundException(`Station avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant : retourner 404 pour ne pas révéler l'existence
    if (userStationId && station.id !== userStationId) {
      throw new NotFoundException(`Station avec l'ID ${id} non trouvée`);
    }

    return station;
  }

  async update(
    id: string,
    dto: UpdateStationDto,
    userStationId?: string | null,
  ): Promise<Station> {
    await this.findOne(id, userStationId);

    return this.prisma.station.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userStationId?: string | null): Promise<void> {
    const station = await this.findOne(id, userStationId);

    // Transaction de désactivation en cascade
    await this.prisma.$transaction(async (tx) => {
      // 1. Désactiver la station
      await tx.station.update({
        where: { id },
        data: { isActive: false },
      });

      // 2. Désactiver tous les utilisateurs de la station
      await tx.user.updateMany({
        where: { stationId: id, isActive: true },
        data: { isActive: false },
      });

      // 3. Désactiver toutes les cuves
      await tx.tank.updateMany({
        where: { stationId: id, isActive: true },
        data: { isActive: false },
      });

      // 4. Désactiver tous les distributeurs
      await tx.dispenser.updateMany({
        where: { stationId: id, isActive: true },
        data: { isActive: false },
      });

      // 5. Désactiver tous les pistolets des distributeurs de la station
      const dispenserIds = await tx.dispenser.findMany({
        where: { stationId: id },
        select: { id: true },
      });
      if (dispenserIds.length > 0) {
        await tx.nozzle.updateMany({
          where: {
            dispenserId: { in: dispenserIds.map((d) => d.id) },
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      // 6. Désactiver tous les clients de la station
      await tx.client.updateMany({
        where: { stationId: id, isActive: true },
        data: { isActive: false },
      });

      // 7. Révoquer les refresh tokens des utilisateurs de la station
      const userIds = await tx.user.findMany({
        where: { stationId: id },
        select: { id: true },
      });
      if (userIds.length > 0) {
        await tx.refreshToken.updateMany({
          where: {
            userId: { in: userIds.map((u) => u.id) },
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }

      // 8. Fermer les shifts ouverts
      if (dispenserIds.length > 0) {
        const nozzleIds = await tx.nozzle.findMany({
          where: {
            dispenserId: { in: dispenserIds.map((d) => d.id) },
          },
          select: { id: true },
        });
        if (nozzleIds.length > 0) {
          await tx.shift.updateMany({
            where: {
              nozzleId: { in: nozzleIds.map((n) => n.id) },
              status: 'OPEN',
            },
            data: {
              status: 'CLOSED',
              endedAt: new Date(),
            },
          });
        }
      }
    });

    this.logger.log(
      `Station ${station.name} (${id}) désactivée avec cascade complète`,
    );
  }
}

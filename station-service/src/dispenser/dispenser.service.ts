import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Dispenser } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateDispenserDto, UpdateDispenserDto } from './dto/index.js';

@Injectable()
export class DispenserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDispenserDto): Promise<Dispenser> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });
    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Vérifier l'unicité de la référence par station
    const existing = await this.prisma.dispenser.findUnique({
      where: {
        stationId_reference: {
          stationId: dto.stationId,
          reference: dto.reference,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un distributeur avec la référence "${dto.reference}" existe déjà dans cette station`,
      );
    }

    return this.prisma.dispenser.create({
      data: dto,
      include: {
        station: true,
        nozzles: {
          where: { isActive: true },
        },
      },
    });
  }

  async findAll(stationId?: string): Promise<Dispenser[]> {
    return this.prisma.dispenser.findMany({
      where: {
        isActive: true,
        ...(stationId && { stationId }),
      },
      include: {
        station: true,
        nozzles: {
          where: { isActive: true },
          include: {
            fuelType: true,
          },
        },
      },
      orderBy: { reference: 'asc' },
    });
  }

  async findOne(id: string, userStationId?: string | null): Promise<Dispenser> {
    const dispenser = await this.prisma.dispenser.findUnique({
      where: { id },
      include: {
        station: true,
        nozzles: {
          where: { isActive: true },
          include: {
            fuelType: true,
            tank: true,
          },
        },
      },
    });

    if (!dispenser) {
      throw new NotFoundException(`Distributeur avec l'ID ${id} non trouvé`);
    }

    // Masquer les distributeurs désactivés
    if (!dispenser.isActive) {
      throw new NotFoundException(`Distributeur avec l'ID ${id} non trouvé`);
    }

    // Vérification multi-tenant
    if (userStationId && dispenser.stationId !== userStationId) {
      throw new NotFoundException(`Distributeur avec l'ID ${id} non trouvé`);
    }

    return dispenser;
  }

  async update(
    id: string,
    dto: UpdateDispenserDto,
    userStationId?: string | null,
  ): Promise<Dispenser> {
    const dispenser = await this.findOne(id, userStationId);

    // Vérifier l'unicité de la référence si modifiée
    if (dto.reference && dto.reference !== dispenser.reference) {
      const existing = await this.prisma.dispenser.findUnique({
        where: {
          stationId_reference: {
            stationId: dispenser.stationId,
            reference: dto.reference,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Un distributeur avec la référence "${dto.reference}" existe déjà dans cette station`,
        );
      }
    }

    return this.prisma.dispenser.update({
      where: { id },
      data: dto,
      include: {
        station: true,
        nozzles: {
          where: { isActive: true },
        },
      },
    });
  }

  async remove(id: string, userStationId?: string | null): Promise<void> {
    await this.findOne(id, userStationId);

    await this.prisma.dispenser.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

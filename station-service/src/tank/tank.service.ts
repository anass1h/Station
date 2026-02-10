import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tank } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateTankDto, UpdateTankDto } from './dto/index.js';

@Injectable()
export class TankService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTankDto): Promise<Tank> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });
    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Vérifier que le type de carburant existe
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id: dto.fuelTypeId },
    });
    if (!fuelType) {
      throw new NotFoundException(
        `Type de carburant avec l'ID ${dto.fuelTypeId} non trouvé`,
      );
    }

    // Vérifier l'unicité de la référence par station
    const existingTank = await this.prisma.tank.findUnique({
      where: {
        stationId_reference: {
          stationId: dto.stationId,
          reference: dto.reference,
        },
      },
    });
    if (existingTank) {
      throw new ConflictException(
        `Une cuve avec la référence "${dto.reference}" existe déjà dans cette station`,
      );
    }

    // Vérifier que currentLevel <= capacity
    if (dto.currentLevel > dto.capacity) {
      throw new BadRequestException(
        `Le niveau actuel (${dto.currentLevel}L) ne peut pas dépasser la capacité (${dto.capacity}L)`,
      );
    }

    return this.prisma.tank.create({
      data: dto,
      include: {
        station: true,
        fuelType: true,
      },
    });
  }

  async findAll(stationId?: string): Promise<Tank[]> {
    return this.prisma.tank.findMany({
      where: {
        isActive: true,
        ...(stationId && { stationId }),
      },
      include: {
        station: true,
        fuelType: true,
        nozzles: {
          where: { isActive: true },
        },
      },
      orderBy: { reference: 'asc' },
    });
  }

  async findOne(id: string, userStationId?: string | null): Promise<Tank> {
    const tank = await this.prisma.tank.findUnique({
      where: { id },
      include: {
        station: true,
        fuelType: true,
        nozzles: {
          where: { isActive: true },
        },
      },
    });

    if (!tank) {
      throw new NotFoundException(`Cuve avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant
    if (userStationId && tank.stationId !== userStationId) {
      throw new NotFoundException(`Cuve avec l'ID ${id} non trouvée`);
    }

    return tank;
  }

  async update(
    id: string,
    dto: UpdateTankDto,
    userStationId?: string | null,
  ): Promise<Tank> {
    const tank = await this.findOne(id, userStationId);

    // Vérifier l'unicité de la référence si modifiée
    if (dto.reference && dto.reference !== tank.reference) {
      const existingTank = await this.prisma.tank.findUnique({
        where: {
          stationId_reference: {
            stationId: tank.stationId,
            reference: dto.reference,
          },
        },
      });
      if (existingTank) {
        throw new ConflictException(
          `Une cuve avec la référence "${dto.reference}" existe déjà dans cette station`,
        );
      }
    }

    // Vérifier que currentLevel <= capacity
    const newCapacity = dto.capacity ?? Number(tank.capacity);
    const newCurrentLevel = dto.currentLevel ?? Number(tank.currentLevel);
    if (newCurrentLevel > newCapacity) {
      throw new BadRequestException(
        `Le niveau actuel (${newCurrentLevel}L) ne peut pas dépasser la capacité (${newCapacity}L)`,
      );
    }

    return this.prisma.tank.update({
      where: { id },
      data: dto,
      include: {
        station: true,
        fuelType: true,
        nozzles: {
          where: { isActive: true },
        },
      },
    });
  }

  async remove(id: string, userStationId?: string | null): Promise<void> {
    await this.findOne(id, userStationId);

    await this.prisma.tank.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

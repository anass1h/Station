import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Nozzle } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateNozzleDto, UpdateNozzleDto } from './dto/index.js';

@Injectable()
export class NozzleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNozzleDto): Promise<Nozzle> {
    // Vérifier que le distributeur existe
    const dispenser = await this.prisma.dispenser.findUnique({
      where: { id: dto.dispenserId },
    });
    if (!dispenser) {
      throw new NotFoundException(`Distributeur avec l'ID ${dto.dispenserId} non trouvé`);
    }

    // Vérifier que la cuve existe
    const tank = await this.prisma.tank.findUnique({
      where: { id: dto.tankId },
    });
    if (!tank) {
      throw new NotFoundException(`Cuve avec l'ID ${dto.tankId} non trouvée`);
    }

    // Vérifier que le type de carburant existe
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id: dto.fuelTypeId },
    });
    if (!fuelType) {
      throw new NotFoundException(`Type de carburant avec l'ID ${dto.fuelTypeId} non trouvé`);
    }

    // Vérifier la cohérence tank.fuelTypeId === dto.fuelTypeId
    if (tank.fuelTypeId !== dto.fuelTypeId) {
      throw new BadRequestException(
        `Le type de carburant du pistolet doit correspondre à celui de la cuve`,
      );
    }

    // Vérifier l'unicité de la référence par distributeur
    const existing = await this.prisma.nozzle.findUnique({
      where: {
        dispenserId_reference: {
          dispenserId: dto.dispenserId,
          reference: dto.reference,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Un pistolet avec la référence "${dto.reference}" existe déjà sur ce distributeur`,
      );
    }

    return this.prisma.nozzle.create({
      data: dto,
      include: {
        dispenser: true,
        tank: true,
        fuelType: true,
      },
    });
  }

  async findAll(dispenserId?: string, stationId?: string): Promise<Nozzle[]> {
    return this.prisma.nozzle.findMany({
      where: {
        isActive: true,
        ...(dispenserId && { dispenserId }),
        ...(stationId && {
          dispenser: {
            stationId,
          },
        }),
      },
      include: {
        dispenser: {
          include: {
            station: true,
          },
        },
        tank: true,
        fuelType: true,
      },
      orderBy: [
        { dispenser: { reference: 'asc' } },
        { position: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<Nozzle> {
    const nozzle = await this.prisma.nozzle.findUnique({
      where: { id },
      include: {
        dispenser: {
          include: {
            station: true,
          },
        },
        tank: true,
        fuelType: true,
      },
    });

    if (!nozzle) {
      throw new NotFoundException(`Pistolet avec l'ID ${id} non trouvé`);
    }

    return nozzle;
  }

  async update(id: string, dto: UpdateNozzleDto): Promise<Nozzle> {
    const nozzle = await this.findOne(id);

    // Vérifier la cuve si modifiée
    if (dto.tankId && dto.tankId !== nozzle.tankId) {
      const tank = await this.prisma.tank.findUnique({
        where: { id: dto.tankId },
      });
      if (!tank) {
        throw new NotFoundException(`Cuve avec l'ID ${dto.tankId} non trouvée`);
      }

      // Vérifier la cohérence du type de carburant
      const fuelTypeId = dto.fuelTypeId ?? nozzle.fuelTypeId;
      if (tank.fuelTypeId !== fuelTypeId) {
        throw new BadRequestException(
          `Le type de carburant du pistolet doit correspondre à celui de la cuve`,
        );
      }
    }

    // Vérifier le type de carburant si modifié
    if (dto.fuelTypeId && dto.fuelTypeId !== nozzle.fuelTypeId) {
      const fuelType = await this.prisma.fuelType.findUnique({
        where: { id: dto.fuelTypeId },
      });
      if (!fuelType) {
        throw new NotFoundException(`Type de carburant avec l'ID ${dto.fuelTypeId} non trouvé`);
      }

      // Vérifier la cohérence avec la cuve
      const tankId = dto.tankId ?? nozzle.tankId;
      const tank = await this.prisma.tank.findUnique({
        where: { id: tankId },
      });
      if (tank && tank.fuelTypeId !== dto.fuelTypeId) {
        throw new BadRequestException(
          `Le type de carburant du pistolet doit correspondre à celui de la cuve`,
        );
      }
    }

    // Vérifier l'unicité de la référence si modifiée
    if (dto.reference && dto.reference !== nozzle.reference) {
      const existing = await this.prisma.nozzle.findUnique({
        where: {
          dispenserId_reference: {
            dispenserId: nozzle.dispenserId,
            reference: dto.reference,
          },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Un pistolet avec la référence "${dto.reference}" existe déjà sur ce distributeur`,
        );
      }
    }

    return this.prisma.nozzle.update({
      where: { id },
      data: dto,
      include: {
        dispenser: {
          include: {
            station: true,
          },
        },
        tank: true,
        fuelType: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.nozzle.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

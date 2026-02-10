import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FuelType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateFuelTypeDto, UpdateFuelTypeDto } from './dto/index.js';

@Injectable()
export class FuelTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFuelTypeDto): Promise<FuelType> {
    const existing = await this.prisma.fuelType.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Le code "${dto.code}" existe déjà`);
    }

    return this.prisma.fuelType.create({
      data: dto,
    });
  }

  async findAll(): Promise<FuelType[]> {
    return this.prisma.fuelType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string): Promise<FuelType> {
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id },
    });

    if (!fuelType) {
      throw new NotFoundException(
        `Type de carburant avec l'ID ${id} non trouvé`,
      );
    }

    if (!fuelType.isActive) {
      throw new NotFoundException(
        `Type de carburant avec l'ID ${id} non trouvé`,
      );
    }

    return fuelType;
  }

  async update(id: string, dto: UpdateFuelTypeDto): Promise<FuelType> {
    const fuelType = await this.findOne(id);

    if (dto.code && dto.code !== fuelType.code) {
      const existing = await this.prisma.fuelType.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException(`Le code "${dto.code}" existe déjà`);
      }
    }

    return this.prisma.fuelType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.fuelType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

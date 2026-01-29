import { Injectable, NotFoundException } from '@nestjs/common';
import { Station } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreateStationDto, UpdateStationDto } from './dto/index.js';

@Injectable()
export class StationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStationDto): Promise<Station> {
    return this.prisma.station.create({
      data: dto,
    });
  }

  async findAll(): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Station> {
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

    return station;
  }

  async update(id: string, dto: UpdateStationDto): Promise<Station> {
    await this.findOne(id);

    return this.prisma.station.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.station.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

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

  async findAll(stationId?: string | null): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: {
        isActive: true,
        ...(stationId && { id: stationId }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userStationId?: string | null): Promise<Station> {
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
    await this.findOne(id, userStationId);

    await this.prisma.station.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Price } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CreatePriceDto } from './dto/index.js';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePriceDto, userId: string): Promise<Price> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(`Station avec l'ID ${dto.stationId} non trouvée`);
    }

    // Vérifier que le type de carburant existe
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id: dto.fuelTypeId },
    });

    if (!fuelType) {
      throw new NotFoundException(`Type de carburant avec l'ID ${dto.fuelTypeId} non trouvé`);
    }

    const effectiveFromDate = new Date(dto.effectiveFrom);

    // Transaction : clôturer l'ancien prix et créer le nouveau
    const [, newPrice] = await this.prisma.$transaction([
      // Clôturer le prix actif pour ce couple station/fuelType
      this.prisma.price.updateMany({
        where: {
          stationId: dto.stationId,
          fuelTypeId: dto.fuelTypeId,
          effectiveTo: null,
        },
        data: {
          effectiveTo: effectiveFromDate,
        },
      }),
      // Créer le nouveau prix
      this.prisma.price.create({
        data: {
          stationId: dto.stationId,
          fuelTypeId: dto.fuelTypeId,
          sellingPrice: dto.sellingPrice,
          sellingPriceHT: dto.sellingPriceHT,
          purchasePrice: dto.purchasePrice,
          effectiveFrom: effectiveFromDate,
          effectiveTo: null,
          createdByUserId: userId,
        },
        include: {
          station: true,
          fuelType: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    this.logger.log(
      `Nouveau prix créé pour ${fuelType.name} à la station ${station.name}: ${dto.sellingPrice} MAD/L`,
    );

    return newPrice;
  }

  async getCurrentPrice(stationId: string, fuelTypeId: string): Promise<Price | null> {
    return this.prisma.price.findFirst({
      where: {
        stationId,
        fuelTypeId,
        effectiveTo: null,
      },
      include: {
        station: true,
        fuelType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getPriceHistory(stationId: string, fuelTypeId: string): Promise<Price[]> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new NotFoundException(`Station avec l'ID ${stationId} non trouvée`);
    }

    // Vérifier que le type de carburant existe
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id: fuelTypeId },
    });

    if (!fuelType) {
      throw new NotFoundException(`Type de carburant avec l'ID ${fuelTypeId} non trouvé`);
    }

    return this.prisma.price.findMany({
      where: {
        stationId,
        fuelTypeId,
      },
      include: {
        fuelType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getPriceAtDate(
    stationId: string,
    fuelTypeId: string,
    date: Date,
  ): Promise<Price | null> {
    return this.prisma.price.findFirst({
      where: {
        stationId,
        fuelTypeId,
        effectiveFrom: { lte: date },
        OR: [
          { effectiveTo: { gt: date } },
          { effectiveTo: null },
        ],
      },
      include: {
        station: true,
        fuelType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findAllCurrent(stationId: string): Promise<Price[]> {
    // Vérifier que la station existe
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new NotFoundException(`Station avec l'ID ${stationId} non trouvée`);
    }

    return this.prisma.price.findMany({
      where: {
        stationId,
        effectiveTo: null,
      },
      include: {
        fuelType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { fuelType: { name: 'asc' } },
    });
  }

  async findAll(stationId?: string, fuelTypeId?: string): Promise<Price[]> {
    return this.prisma.price.findMany({
      where: {
        ...(stationId && { stationId }),
        ...(fuelTypeId && { fuelTypeId }),
      },
      include: {
        station: true,
        fuelType: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Delivery, MovementType } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { StockValidator } from '../common/validators/index.js';
import { StockCalculator } from '../common/calculators/index.js';
import { CreateDeliveryDto } from './dto/index.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  PaginatedResponse,
  buildPaginatedResponse,
  toPrismaQuery,
  toDateRangeFilter,
} from '../common/interfaces/paginated-result.interface.js';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockValidator: StockValidator,
    private readonly stockCalculator: StockCalculator,
  ) {}

  async create(dto: CreateDeliveryDto, userId: string): Promise<Delivery> {
    // Utiliser le validator pour vérifier que la cuve existe
    const tankCheck = await this.stockValidator.validateTankExists(dto.tankId);
    if (!tankCheck.valid) {
      throw new NotFoundException(tankCheck.message);
    }

    // Récupérer les infos de la cuve
    const tank = await this.prisma.tank.findUnique({
      where: { id: dto.tankId },
      include: {
        station: true,
        fuelType: true,
      },
    });

    // Vérifier que le fournisseur existe
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new NotFoundException(
        `Fournisseur avec l'ID ${dto.supplierId} non trouvé`,
      );
    }

    if (!supplier.isActive) {
      throw new BadRequestException('Ce fournisseur est désactivé');
    }

    // Vérifier l'unicité du numéro de bon de livraison
    const existingDelivery = await this.prisma.delivery.findUnique({
      where: { deliveryNoteNumber: dto.deliveryNoteNumber },
    });

    if (existingDelivery) {
      throw new ConflictException(
        `Un bon de livraison avec le numéro "${dto.deliveryNoteNumber}" existe déjà`,
      );
    }

    // Utiliser le validator pour vérifier la capacité de la cuve
    const capacityCheck = await this.stockValidator.validateTankCapacity(
      dto.tankId,
      dto.quantity,
    );
    if (!capacityCheck.valid) {
      throw new BadRequestException(capacityCheck.message);
    }

    // Utiliser le validator pour vérifier la cohérence des niveaux
    const levelCheck = await this.stockValidator.validateDeliveryLevels(
      dto.tankId,
      dto.levelBefore,
      dto.levelAfter,
      dto.quantity,
    );
    if (!levelCheck.valid) {
      this.logger.warn(levelCheck.message);
      // On log l'avertissement mais on ne bloque pas
    }

    // Créer la livraison et mettre à jour le stock en transaction
    const [delivery] = await this.prisma.$transaction([
      // Créer la livraison
      this.prisma.delivery.create({
        data: {
          tankId: dto.tankId,
          supplierId: dto.supplierId,
          receivedByUserId: userId,
          deliveryNoteNumber: dto.deliveryNoteNumber,
          quantity: dto.quantity,
          purchasePrice: dto.purchasePrice,
          levelBefore: dto.levelBefore,
          levelAfter: dto.levelAfter,
          temperature: dto.temperature,
          deliveredAt: new Date(dto.deliveredAt),
        },
        include: {
          tank: {
            include: {
              station: true,
              fuelType: true,
            },
          },
          supplier: true,
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      // Mettre à jour le niveau de la cuve
      this.prisma.tank.update({
        where: { id: dto.tankId },
        data: { currentLevel: dto.levelAfter },
      }),
      // Créer le mouvement de stock
      this.prisma.stockMovement.create({
        data: {
          tankId: dto.tankId,
          userId,
          movementType: MovementType.DELIVERY,
          quantity: dto.quantity,
          balanceAfter: dto.levelAfter,
          referenceId: dto.deliveryNoteNumber,
          referenceType: 'DELIVERY',
          reason: `Livraison ${dto.deliveryNoteNumber} - Fournisseur: ${supplier.name}`,
        },
      }),
    ]);

    this.logger.log(
      `Livraison ${dto.deliveryNoteNumber} enregistrée: ${dto.quantity}L de ${tank!.fuelType.name} dans ${tank!.reference}`,
    );

    return delivery;
  }

  async findOne(id: string, userStationId?: string | null): Promise<Delivery> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        tank: {
          include: {
            station: true,
            fuelType: true,
          },
        },
        supplier: true,
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Livraison avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant via tank.stationId
    if (userStationId && delivery.tank.stationId !== userStationId) {
      throw new NotFoundException(`Livraison avec l'ID ${id} non trouvée`);
    }

    return delivery;
  }

  async findByTank(tankId: string): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: { tankId },
      include: {
        supplier: true,
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async findBySupplier(supplierId: string): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: { supplierId },
      include: {
        tank: {
          include: {
            station: true,
            fuelType: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async findAll(
    pagination: PaginationDto,
    stationId?: string | null,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      tankId?: string;
      supplierId?: string;
    },
  ): Promise<PaginatedResponse<Delivery>> {
    const { page = 1, perPage = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take, orderBy } = toPrismaQuery(page, perPage, sortBy, sortOrder);

    const dateFilter = toDateRangeFilter(filters?.dateFrom, filters?.dateTo);

    const where = {
      ...(stationId && {
        tank: {
          stationId,
        },
      }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(filters?.tankId && { tankId: filters.tankId }),
      ...(filters?.supplierId && { supplierId: filters.supplierId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where,
        include: {
          tank: {
            include: {
              station: true,
              fuelType: true,
            },
          },
          supplier: true,
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async findByStation(
    stationId: string,
    filters?: {
      from?: Date;
      to?: Date;
      supplierId?: string;
      fuelTypeId?: string;
    },
  ): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: {
        tank: {
          stationId,
          ...(filters?.fuelTypeId && { fuelTypeId: filters.fuelTypeId }),
        },
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
        ...((filters?.from || filters?.to) && {
          deliveredAt: {
            ...(filters?.from && { gte: filters.from }),
            ...(filters?.to && { lte: filters.to }),
          },
        }),
      },
      include: {
        tank: {
          include: {
            fuelType: true,
          },
        },
        supplier: true,
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async getStationDeliverySummary(
    stationId: string,
    from?: Date,
    to?: Date,
  ): Promise<{
    totalQuantity: number;
    totalValue: number;
    deliveriesCount: number;
    byFuelType: Array<{
      fuelTypeId: string;
      fuelTypeName: string;
      quantity: number;
      value: number;
    }>;
    bySupplier: Array<{
      supplierId: string;
      supplierName: string;
      quantity: number;
      value: number;
    }>;
  }> {
    const deliveries = await this.prisma.delivery.findMany({
      where: {
        tank: { stationId },
        ...((from || to) && {
          deliveredAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      },
      include: {
        tank: {
          include: {
            fuelType: true,
          },
        },
        supplier: true,
      },
    });

    const totalQuantity = deliveries.reduce(
      (sum, d) => sum + Number(d.quantity),
      0,
    );
    const totalValue = deliveries.reduce(
      (sum, d) => sum + Number(d.quantity) * Number(d.purchasePrice),
      0,
    );

    // Agrégation par type de carburant
    const byFuelTypeMap = new Map<
      string,
      { name: string; quantity: number; value: number }
    >();
    for (const delivery of deliveries) {
      const fuelTypeId = delivery.tank.fuelTypeId;
      const existing = byFuelTypeMap.get(fuelTypeId) || {
        name: delivery.tank.fuelType.name,
        quantity: 0,
        value: 0,
      };
      existing.quantity += Number(delivery.quantity);
      existing.value +=
        Number(delivery.quantity) * Number(delivery.purchasePrice);
      byFuelTypeMap.set(fuelTypeId, existing);
    }

    // Agrégation par fournisseur
    const bySupplierMap = new Map<
      string,
      { name: string; quantity: number; value: number }
    >();
    for (const delivery of deliveries) {
      const existing = bySupplierMap.get(delivery.supplierId) || {
        name: delivery.supplier.name,
        quantity: 0,
        value: 0,
      };
      existing.quantity += Number(delivery.quantity);
      existing.value +=
        Number(delivery.quantity) * Number(delivery.purchasePrice);
      bySupplierMap.set(delivery.supplierId, existing);
    }

    return {
      totalQuantity,
      totalValue,
      deliveriesCount: deliveries.length,
      byFuelType: Array.from(byFuelTypeMap.entries()).map(([id, data]) => ({
        fuelTypeId: id,
        fuelTypeName: data.name,
        quantity: data.quantity,
        value: data.value,
      })),
      bySupplier: Array.from(bySupplierMap.entries()).map(([id, data]) => ({
        supplierId: id,
        supplierName: data.name,
        quantity: data.quantity,
        value: data.value,
      })),
    };
  }

  async getTankStockAnalysis(tankId: string): Promise<{
    theoretical: number;
    actual: number;
    variance: number;
    variancePercent: number;
    daysRemaining: number;
    avgDailyConsumption: number;
  }> {
    const varianceResult = await this.stockCalculator.calculateVariance(tankId);
    const daysResult =
      await this.stockCalculator.calculateDaysRemaining(tankId);

    return {
      theoretical: varianceResult.theoretical,
      actual: varianceResult.actual,
      variance: varianceResult.variance,
      variancePercent: varianceResult.variancePercent,
      daysRemaining: daysResult.daysRemaining,
      avgDailyConsumption: daysResult.avgDailyConsumption,
    };
  }
}

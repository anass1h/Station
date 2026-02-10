import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sale } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { SaleValidator } from '../common/validators/index.js';
import {
  PriceCalculator,
  MarginCalculator,
} from '../common/calculators/index.js';
import { CreateSaleDto } from './dto/index.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  PaginatedResponse,
  buildPaginatedResponse,
  toPrismaQuery,
  toDateRangeFilter,
} from '../common/interfaces/paginated-result.interface.js';

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saleValidator: SaleValidator,
    private readonly priceCalculator: PriceCalculator,
    private readonly marginCalculator: MarginCalculator,
  ) {}

  /**
   * Calcule les marges pour une vente
   */
  async calculateSaleMargins(saleId: string): Promise<{
    unitMargin: number;
    totalMargin: number;
    marginPercent: number;
  }> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        shift: {
          include: {
            nozzle: {
              include: {
                dispenser: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Vente avec l'ID ${saleId} non trouvée`);
    }

    const stationId = sale.shift.nozzle.dispenser.stationId;
    const currentPrice = await this.priceCalculator.getCurrentPrice(
      stationId,
      sale.fuelTypeId,
    );

    if (!currentPrice) {
      return { unitMargin: 0, totalMargin: 0, marginPercent: 0 };
    }

    const sellingPriceHT = this.priceCalculator.calculateHT(
      Number(sale.unitPrice),
    );
    const purchasePrice = currentPrice.purchasePrice;

    return {
      unitMargin: this.marginCalculator.calculateUnitMargin(
        sellingPriceHT,
        purchasePrice,
      ),
      totalMargin: this.marginCalculator.calculateTotalMargin(
        Number(sale.quantity),
        sellingPriceHT,
        purchasePrice,
      ),
      marginPercent: this.marginCalculator.calculateMarginPercent(
        sellingPriceHT,
        purchasePrice,
      ),
    };
  }

  async create(dto: CreateSaleDto): Promise<Sale> {
    // Vérifier que le shift existe et est OPEN
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
      include: {
        nozzle: {
          include: {
            dispenser: true,
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift avec l'ID ${dto.shiftId} non trouvé`);
    }

    // Utiliser le validator pour vérifier le statut du shift
    const shiftCheck = await this.saleValidator.validateShiftOpen(dto.shiftId);
    if (!shiftCheck.valid) {
      throw new BadRequestException(shiftCheck.message);
    }

    // Vérifier que le fuelType existe
    const fuelType = await this.prisma.fuelType.findUnique({
      where: { id: dto.fuelTypeId },
    });

    if (!fuelType) {
      throw new NotFoundException(
        `Type de carburant avec l'ID ${dto.fuelTypeId} non trouvé`,
      );
    }

    // Vérifier que le client existe si clientId fourni
    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(
          `Client avec l'ID ${dto.clientId} non trouvé`,
        );
      }
    }

    // Utiliser le calculator pour récupérer le prix actif
    const stationId = shift.nozzle.dispenser.stationId;
    const currentPrice = await this.priceCalculator.getCurrentPrice(
      stationId,
      dto.fuelTypeId,
    );
    if (!currentPrice) {
      throw new BadRequestException(
        `Aucun prix actif trouvé pour ce type de carburant dans cette station`,
      );
    }

    // Vérifier les moyens de paiement avec le validator
    for (const payment of dto.payments) {
      const methodCheck = await this.saleValidator.validatePaymentMethod(
        payment.paymentMethodId,
      );
      if (!methodCheck.valid) {
        throw new BadRequestException(methodCheck.message);
      }

      const referenceCheck = await this.saleValidator.validatePaymentReference(
        payment.paymentMethodId,
        payment.reference,
      );
      if (!referenceCheck.valid) {
        throw new BadRequestException(referenceCheck.message);
      }
    }

    // Calculer le montant total avec le calculator
    const unitPrice = currentPrice.sellingPrice;
    const totalAmount = dto.quantity * unitPrice;

    // Utiliser le validator pour vérifier le total des paiements
    const paymentCheck = this.saleValidator.validatePaymentTotal(
      totalAmount,
      dto.payments,
    );
    if (!paymentCheck.valid) {
      throw new BadRequestException(paymentCheck.message);
    }

    // Créer la vente avec ses paiements en transaction
    return this.prisma.sale.create({
      data: {
        shiftId: dto.shiftId,
        fuelTypeId: dto.fuelTypeId,
        clientId: dto.clientId,
        quantity: dto.quantity,
        unitPrice,
        totalAmount,
        soldAt: new Date(),
        payments: {
          create: dto.payments.map((p) => ({
            paymentMethodId: p.paymentMethodId,
            amount: p.amount,
            reference: p.reference,
          })),
        },
      },
      include: {
        fuelType: true,
        client: true,
        shift: {
          include: {
            pompiste: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badgeCode: true,
              },
            },
            nozzle: {
              include: {
                dispenser: { include: { station: true } },
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userStationId?: string | null): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        fuelType: true,
        client: true,
        shift: {
          include: {
            pompiste: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badgeCode: true,
              },
            },
            nozzle: {
              include: {
                dispenser: { include: { station: true } },
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Vente avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant via shift.nozzle.dispenser.stationId
    if (
      userStationId &&
      sale.shift.nozzle.dispenser.stationId !== userStationId
    ) {
      throw new NotFoundException(`Vente avec l'ID ${id} non trouvée`);
    }

    return sale;
  }

  async findAll(
    pagination: PaginationDto,
    stationId?: string | null,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      shiftId?: string;
      fuelTypeId?: string;
      clientId?: string;
    },
  ): Promise<PaginatedResponse<Sale>> {
    const { page = 1, perPage = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const { skip, take, orderBy } = toPrismaQuery(page, perPage, sortBy, sortOrder);

    const dateFilter = toDateRangeFilter(filters?.dateFrom, filters?.dateTo);

    const where = {
      ...(stationId && {
        shift: {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        },
      }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(filters?.shiftId && { shiftId: filters.shiftId }),
      ...(filters?.fuelTypeId && { fuelTypeId: filters.fuelTypeId }),
      ...(filters?.clientId && { clientId: filters.clientId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        include: {
          fuelType: true,
          client: true,
          shift: {
            include: {
              pompiste: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  badgeCode: true,
                },
              },
              nozzle: {
                include: {
                  dispenser: { include: { station: true } },
                },
              },
            },
          },
          payments: {
            include: {
              paymentMethod: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, perPage);
  }

  async findByShift(shiftId: string): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: { shiftId },
      include: {
        fuelType: true,
        client: true,
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { soldAt: 'desc' },
    });
  }

  async findRecent(stationId: string, limit: number = 10) {
    const sales = await this.prisma.sale.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        },
      },
      include: {
        fuelType: true,
        shift: {
          include: {
            pompiste: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { soldAt: 'desc' },
      take: limit,
    });

    return sales.map((sale) => ({
      id: sale.id,
      soldAt: sale.soldAt,
      pompisteName: `${sale.shift.pompiste.firstName} ${sale.shift.pompiste.lastName}`,
      fuelTypeName: sale.fuelType.name,
      quantity: Number(sale.quantity),
      totalAmount: Number(sale.totalAmount),
      paymentMethod: sale.payments[0]?.paymentMethod?.name || 'N/A',
    }));
  }

  async findByStation(
    stationId: string,
    filters?: {
      from?: Date;
      to?: Date;
      fuelTypeId?: string;
      clientId?: string;
    },
  ): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        },
        ...(filters?.fuelTypeId && { fuelTypeId: filters.fuelTypeId }),
        ...(filters?.clientId && { clientId: filters.clientId }),
        ...((filters?.from || filters?.to) && {
          soldAt: {
            ...(filters?.from && { gte: filters.from }),
            ...(filters?.to && { lte: filters.to }),
          },
        }),
      },
      include: {
        fuelType: true,
        client: true,
        shift: {
          include: {
            pompiste: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badgeCode: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { soldAt: 'desc' },
    });
  }

  async findByClient(clientId: string): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: { clientId },
      include: {
        fuelType: true,
        shift: {
          include: {
            nozzle: {
              include: {
                dispenser: { include: { station: true } },
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { soldAt: 'desc' },
    });
  }

  async getShiftSummary(shiftId: string): Promise<{
    totalQuantity: number;
    totalAmount: number;
    salesCount: number;
    byFuelType: Array<{
      fuelTypeId: string;
      fuelTypeName: string;
      quantity: number;
      amount: number;
    }>;
    byPaymentMethod: Array<{
      paymentMethodId: string;
      paymentMethodName: string;
      amount: number;
    }>;
  }> {
    const sales = await this.prisma.sale.findMany({
      where: { shiftId },
      include: {
        fuelType: true,
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    const totalQuantity = sales.reduce((sum, s) => sum + Number(s.quantity), 0);
    const totalAmount = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0,
    );

    // Agrégation par type de carburant
    const byFuelTypeMap = new Map<
      string,
      { name: string; quantity: number; amount: number }
    >();
    for (const sale of sales) {
      const existing = byFuelTypeMap.get(sale.fuelTypeId) || {
        name: sale.fuelType.name,
        quantity: 0,
        amount: 0,
      };
      existing.quantity += Number(sale.quantity);
      existing.amount += Number(sale.totalAmount);
      byFuelTypeMap.set(sale.fuelTypeId, existing);
    }

    // Agrégation par moyen de paiement
    const byPaymentMethodMap = new Map<
      string,
      { name: string; amount: number }
    >();
    for (const sale of sales) {
      for (const payment of sale.payments) {
        const existing = byPaymentMethodMap.get(payment.paymentMethodId) || {
          name: payment.paymentMethod.name,
          amount: 0,
        };
        existing.amount += Number(payment.amount);
        byPaymentMethodMap.set(payment.paymentMethodId, existing);
      }
    }

    return {
      totalQuantity,
      totalAmount,
      salesCount: sales.length,
      byFuelType: Array.from(byFuelTypeMap.entries()).map(([id, data]) => ({
        fuelTypeId: id,
        fuelTypeName: data.name,
        quantity: data.quantity,
        amount: data.amount,
      })),
      byPaymentMethod: Array.from(byPaymentMethodMap.entries()).map(
        ([id, data]) => ({
          paymentMethodId: id,
          paymentMethodName: data.name,
          amount: data.amount,
        }),
      ),
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CashRegister, DebtReason, ShiftStatus } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { CloseCashRegisterDto } from './dto/index.js';
import { PompisteDebtService } from '../pompiste-debt/index.js';

@Injectable()
export class CashRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PompisteDebtService))
    private readonly pompisteDebtService: PompisteDebtService,
  ) {}

  async close(
    dto: CloseCashRegisterDto,
    userId?: string,
  ): Promise<CashRegister & { debtCreated?: boolean }> {
    // Vérifier que le shift existe
    const shift = await this.prisma.shift.findUnique({
      where: { id: dto.shiftId },
      include: {
        nozzle: {
          include: {
            dispenser: true,
          },
        },
        cashRegister: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift avec l'ID ${dto.shiftId} non trouvé`);
    }

    // Vérifier que le shift est CLOSED
    if (shift.status === ShiftStatus.OPEN) {
      throw new BadRequestException(
        'Le shift doit être clôturé avant de faire la clôture de caisse',
      );
    }

    if (shift.status === ShiftStatus.VALIDATED) {
      throw new BadRequestException(
        'Le shift est déjà validé, impossible de modifier la clôture de caisse',
      );
    }

    // Vérifier qu'il n'y a pas déjà une clôture pour ce shift
    if (shift.cashRegister) {
      throw new ConflictException(
        'Une clôture de caisse existe déjà pour ce shift',
      );
    }

    // Récupérer toutes les ventes du shift avec leurs paiements
    const sales = await this.prisma.sale.findMany({
      where: { shiftId: dto.shiftId },
      include: {
        payments: true,
      },
    });

    // Calculer expectedTotal depuis les ventes
    const expectedTotal = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );

    // Calculer expectedAmount par paymentMethod
    const expectedByPaymentMethod = new Map<string, number>();
    for (const sale of sales) {
      for (const payment of sale.payments) {
        const current =
          expectedByPaymentMethod.get(payment.paymentMethodId) || 0;
        expectedByPaymentMethod.set(
          payment.paymentMethodId,
          current + Number(payment.amount),
        );
      }
    }

    // Vérifier les moyens de paiement fournis
    for (const detail of dto.details) {
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: detail.paymentMethodId },
      });

      if (!paymentMethod) {
        throw new NotFoundException(
          `Moyen de paiement avec l'ID ${detail.paymentMethodId} non trouvé`,
        );
      }
    }

    // Calculer actualTotal
    const actualTotal = dto.details.reduce(
      (sum, detail) => sum + detail.actualAmount,
      0,
    );

    // Calculer variance globale
    const variance = actualTotal - expectedTotal;

    // Créer le CashRegister avec ses PaymentDetails
    const cashRegister = await this.prisma.cashRegister.create({
      data: {
        shiftId: dto.shiftId,
        expectedTotal,
        actualTotal,
        variance,
        varianceNote: dto.varianceNote,
        closedAt: new Date(),
        paymentDetails: {
          create: dto.details.map((detail) => {
            const expectedAmount =
              expectedByPaymentMethod.get(detail.paymentMethodId) || 0;
            return {
              paymentMethodId: detail.paymentMethodId,
              expectedAmount,
              actualAmount: detail.actualAmount,
              variance: detail.actualAmount - expectedAmount,
              reference: detail.reference,
            };
          }),
        },
      },
      include: {
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
                fuelType: true,
              },
            },
          },
        },
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    // Créer automatiquement une dette si variance négative et option activée
    let debtCreated = false;
    if (dto.createDebtOnNegativeVariance && variance < 0 && userId) {
      const stationId = cashRegister.shift.nozzle.dispenser.station.id;
      const pompisteId = cashRegister.shift.pompiste.id;
      const debtAmount = Math.abs(variance);

      await this.pompisteDebtService.create(
        {
          pompisteId,
          stationId,
          amount: debtAmount,
          reason: DebtReason.CASH_VARIANCE,
          description: `Écart de caisse négatif du ${new Date().toLocaleDateString('fr-FR')} - Shift ID: ${dto.shiftId}`,
          relatedEntityId: cashRegister.id,
          relatedEntityType: 'CashRegister',
        },
        userId,
      );
      debtCreated = true;
    }

    return { ...cashRegister, debtCreated };
  }

  async findOne(id: string): Promise<CashRegister> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id },
      include: {
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
                fuelType: true,
              },
            },
            sales: {
              include: {
                fuelType: true,
                payments: { include: { paymentMethod: true } },
              },
            },
          },
        },
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    if (!cashRegister) {
      throw new NotFoundException(
        `Clôture de caisse avec l'ID ${id} non trouvée`,
      );
    }

    return cashRegister;
  }

  async findByShift(shiftId: string): Promise<CashRegister | null> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { shiftId },
      include: {
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
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    return cashRegister;
  }

  async findByStation(
    stationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<CashRegister[]> {
    return this.prisma.cashRegister.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        },
        ...((dateFrom || dateTo) && {
          closedAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      },
      include: {
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
                dispenser: true,
              },
            },
          },
        },
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { closedAt: 'desc' },
    });
  }

  async findWithVariance(
    stationId: string,
    minVariance?: number,
  ): Promise<CashRegister[]> {
    const threshold = minVariance ?? 0;

    const cashRegisters = await this.prisma.cashRegister.findMany({
      where: {
        shift: {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        },
        OR: [{ variance: { gt: threshold } }, { variance: { lt: -threshold } }],
      },
      include: {
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
                dispenser: true,
              },
            },
          },
        },
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: [{ variance: 'desc' }, { closedAt: 'desc' }],
    });

    return cashRegisters;
  }

  async findAll(filters: {
    stationId?: string;
    from?: Date;
    to?: Date;
  }): Promise<CashRegister[]> {
    return this.prisma.cashRegister.findMany({
      where: {
        ...(filters.stationId && {
          shift: {
            nozzle: {
              dispenser: {
                stationId: filters.stationId,
              },
            },
          },
        }),
        ...((filters.from || filters.to) && {
          closedAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }),
      },
      include: {
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
        paymentDetails: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { closedAt: 'desc' },
    });
  }
}

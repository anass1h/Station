import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto, AddDebtPaymentDto } from './dto';
import { DebtStatus, UserRole } from '@prisma/client';

@Injectable()
export class PompisteDebtService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new debt for a pompiste
   */
  async create(dto: CreateDebtDto, createdByUserId: string) {
    // Verify pompiste exists and is a POMPISTE
    const pompiste = await this.prisma.user.findUnique({
      where: { id: dto.pompisteId },
    });

    if (!pompiste) {
      throw new NotFoundException(
        `Pompiste avec l'ID ${dto.pompisteId} non trouvé`,
      );
    }

    if (pompiste.role !== UserRole.POMPISTE) {
      throw new BadRequestException(
        "L'utilisateur spécifié n'est pas un pompiste",
      );
    }

    // Verify station exists
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
    });

    if (!station) {
      throw new NotFoundException(
        `Station avec l'ID ${dto.stationId} non trouvée`,
      );
    }

    // Create the debt
    const debt = await this.prisma.pompisteDebt.create({
      data: {
        pompisteId: dto.pompisteId,
        stationId: dto.stationId,
        amount: dto.amount,
        remainingAmount: dto.amount,
        reason: dto.reason,
        status: DebtStatus.PENDING,
        description: dto.description,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        createdByUserId,
      },
      include: {
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return debt;
  }

  /**
   * Add a payment to a debt
   */
  async addPayment(
    debtId: string,
    dto: AddDebtPaymentDto,
    receivedByUserId: string,
  ) {
    // Verify debt exists and can be paid
    const debt = await this.prisma.pompisteDebt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      throw new NotFoundException(`Dette avec l'ID ${debtId} non trouvée`);
    }

    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException('Cette dette est déjà soldée');
    }

    if (debt.status === DebtStatus.CANCELLED) {
      throw new BadRequestException('Cette dette a été annulée');
    }

    const remainingAmount = Number(debt.remainingAmount);
    if (dto.amount > remainingAmount) {
      throw new BadRequestException(
        `Le montant du paiement (${dto.amount}) dépasse le reste à payer (${remainingAmount})`,
      );
    }

    // Calculate new remaining amount and status
    const newRemainingAmount = remainingAmount - dto.amount;
    const newStatus =
      newRemainingAmount === 0 ? DebtStatus.PAID : DebtStatus.PARTIALLY_PAID;

    // Create payment and update debt in a transaction
    const [payment, updatedDebt] = await this.prisma.$transaction([
      this.prisma.debtPayment.create({
        data: {
          debtId,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          note: dto.note,
          receivedByUserId,
          paymentDate: new Date(dto.paymentDate),
        },
        include: {
          receivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.pompisteDebt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemainingAmount,
          status: newStatus,
        },
        include: {
          pompiste: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeCode: true,
            },
          },
          payments: true,
        },
      }),
    ]);

    return { payment, debt: updatedDebt };
  }

  /**
   * Get debts by pompiste
   */
  async findByPompiste(pompisteId: string, status?: DebtStatus) {
    const where: { pompisteId: string; status?: DebtStatus } = { pompisteId };
    if (status) {
      where.status = status;
    }

    return this.prisma.pompisteDebt.findMany({
      where,
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get debts by station
   */
  async findByStation(stationId: string, status?: DebtStatus) {
    const where: { stationId: string; status?: DebtStatus } = { stationId };
    if (status) {
      where.status = status;
    }

    return this.prisma.pompisteDebt.findMany({
      where,
      include: {
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single debt with all relations
   */
  async findOne(id: string, userStationId?: string | null) {
    const debt = await this.prisma.pompisteDebt.findUnique({
      where: { id },
      include: {
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
            phone: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          include: {
            receivedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!debt) {
      throw new NotFoundException(`Dette avec l'ID ${id} non trouvée`);
    }

    // Vérification multi-tenant
    if (userStationId && debt.stationId !== userStationId) {
      throw new NotFoundException(`Dette avec l'ID ${id} non trouvée`);
    }

    return debt;
  }

  /**
   * Get total debt for a pompiste
   */
  async getTotalDebt(pompisteId: string) {
    const result = await this.prisma.pompisteDebt.aggregate({
      where: {
        pompisteId,
        status: {
          notIn: [DebtStatus.PAID, DebtStatus.CANCELLED],
        },
      },
      _sum: {
        remainingAmount: true,
      },
      _count: true,
    });

    return {
      totalAmount: Number(result._sum.remainingAmount || 0),
      debtCount: result._count,
    };
  }

  /**
   * Cancel a debt
   */
  async cancel(
    debtId: string,
    userId: string,
    reason: string,
    userStationId?: string | null,
  ) {
    const debt = await this.findOne(debtId, userStationId);

    if (debt.status === DebtStatus.PAID) {
      throw new BadRequestException(
        "Impossible d'annuler une dette déjà soldée",
      );
    }

    if (debt.status === DebtStatus.CANCELLED) {
      throw new BadRequestException('Cette dette est déjà annulée');
    }

    // Update debt and create audit log in transaction
    const [updatedDebt] = await this.prisma.$transaction([
      this.prisma.pompisteDebt.update({
        where: { id: debtId },
        data: {
          status: DebtStatus.CANCELLED,
          description: debt.description
            ? `${debt.description}\n\n[ANNULÉ] ${reason}`
            : `[ANNULÉ] ${reason}`,
        },
        include: {
          pompiste: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          stationId: debt.stationId,
          action: 'CANCEL',
          entityType: 'PompisteDebt',
          entityId: debtId,
          oldValue: { status: debt.status },
          newValue: { status: DebtStatus.CANCELLED, cancelReason: reason },
        },
      }),
    ]);

    return updatedDebt;
  }

  /**
   * Get debts overview for a station (for dashboard)
   */
  async getDebtsOverview(stationId: string) {
    // Total active debts
    const totalResult = await this.prisma.pompisteDebt.aggregate({
      where: {
        stationId,
        status: {
          notIn: [DebtStatus.PAID, DebtStatus.CANCELLED],
        },
      },
      _sum: {
        remainingAmount: true,
      },
      _count: true,
    });

    // Pompistes with debts
    const pompistesWithDebts = await this.prisma.pompisteDebt.groupBy({
      by: ['pompisteId'],
      where: {
        stationId,
        status: {
          notIn: [DebtStatus.PAID, DebtStatus.CANCELLED],
        },
      },
      _sum: {
        remainingAmount: true,
      },
      orderBy: {
        _sum: {
          remainingAmount: 'desc',
        },
      },
      take: 5,
    });

    // Get pompiste details for top debtors
    const topDebtors = await Promise.all(
      pompistesWithDebts.map(async (item) => {
        const pompiste = await this.prisma.user.findUnique({
          where: { id: item.pompisteId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        });
        return {
          pompiste,
          totalDebt: Number(item._sum.remainingAmount || 0),
        };
      }),
    );

    return {
      totalActiveDebts: Number(totalResult._sum.remainingAmount || 0),
      activeDebtsCount: totalResult._count,
      pompistesWithDebtsCount: pompistesWithDebts.length,
      topDebtors,
    };
  }
}

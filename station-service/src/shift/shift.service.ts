import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Shift, ShiftStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/index.js';
import { ShiftValidator } from '../common/validators/index.js';
import { ShiftCalculator } from '../common/calculators/index.js';
import { StartShiftDto, EndShiftDto } from './dto/index.js';

@Injectable()
export class ShiftService {
  private readonly logger = new Logger(ShiftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shiftValidator: ShiftValidator,
    private readonly shiftCalculator: ShiftCalculator,
  ) {}

  async startShift(pompisteId: string, dto: StartShiftDto): Promise<Shift> {
    // Vérifier que le nozzle existe et est actif
    const nozzle = await this.prisma.nozzle.findUnique({
      where: { id: dto.nozzleId },
      include: {
        dispenser: {
          include: { station: true },
        },
      },
    });

    if (!nozzle) {
      throw new NotFoundException(`Pistolet avec l'ID ${dto.nozzleId} non trouvé`);
    }

    if (!nozzle.isActive) {
      throw new BadRequestException('Ce pistolet est désactivé');
    }

    // Utiliser le validator pour vérifier qu'aucun shift n'est ouvert
    const openShiftCheck = await this.shiftValidator.validateNoOpenShift(dto.nozzleId);
    if (!openShiftCheck.valid) {
      throw new ConflictException(openShiftCheck.message);
    }

    // Vérifier que indexStart >= currentIndex du nozzle
    const currentIndex = Number(nozzle.currentIndex);
    if (dto.indexStart < currentIndex) {
      throw new BadRequestException(
        `L'index de début (${dto.indexStart}) ne peut pas être inférieur à l'index actuel du pistolet (${currentIndex})`,
      );
    }

    // Utiliser le validator pour vérifier la continuité des index
    const continuityCheck = await this.shiftValidator.validateIndexContinuity(
      dto.nozzleId,
      dto.indexStart,
    );
    if (!continuityCheck.valid) {
      this.logger.warn(continuityCheck.message);
      // On log l'avertissement mais on ne bloque pas
    }

    // Créer le shift
    return this.prisma.shift.create({
      data: {
        nozzleId: dto.nozzleId,
        pompisteId,
        indexStart: dto.indexStart,
        startedAt: new Date(),
        status: ShiftStatus.OPEN,
      },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
      },
    });
  }

  async endShift(
    shiftId: string,
    userId: string,
    userRole: UserRole,
    dto: EndShiftDto,
  ): Promise<Shift> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        nozzle: true,
        pompiste: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift avec l'ID ${shiftId} non trouvé`);
    }

    // Vérifier l'appartenance du shift (sauf si gestionnaire)
    if (
      userRole !== UserRole.GESTIONNAIRE &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      const ownershipCheck = await this.shiftValidator.validateShiftOwnership(shiftId, userId);
      if (!ownershipCheck.valid) {
        throw new ForbiddenException(ownershipCheck.message);
      }
    }

    // Vérifier le status du shift
    const statusCheck = await this.shiftValidator.validateShiftStatus(shiftId, ShiftStatus.OPEN);
    if (!statusCheck.valid) {
      throw new BadRequestException(
        `Ce shift ne peut pas être clôturé (status actuel: ${shift.status})`,
      );
    }

    // Vérifier que indexEnd >= indexStart
    const indexStart = Number(shift.indexStart);
    if (dto.indexEnd < indexStart) {
      throw new BadRequestException(
        `L'index de fin (${dto.indexEnd}) ne peut pas être inférieur à l'index de début (${indexStart})`,
      );
    }

    // Calculer la quantité vendue avec le calculator
    const quantitySold = this.shiftCalculator.calculateQuantitySold(indexStart, dto.indexEnd);

    // Transaction : mettre à jour le shift et le nozzle
    const [updatedShift] = await this.prisma.$transaction([
      this.prisma.shift.update({
        where: { id: shiftId },
        data: {
          indexEnd: dto.indexEnd,
          endedAt: new Date(),
          status: ShiftStatus.CLOSED,
          incidentNote: dto.incidentNote,
        },
        include: {
          nozzle: {
            include: {
              dispenser: { include: { station: true } },
              fuelType: true,
            },
          },
          pompiste: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              badgeCode: true,
            },
          },
          sales: true,
          cashRegister: true,
        },
      }),
      this.prisma.nozzle.update({
        where: { id: shift.nozzleId },
        data: { currentIndex: dto.indexEnd },
      }),
    ]);

    this.logger.log(
      `Shift ${shiftId} clôturé. Quantité vendue: ${quantitySold}L`,
    );

    return updatedShift;
  }

  async validateShift(shiftId: string, _gestionnaireId: string): Promise<Shift> {
    // Utiliser le validator pour vérifier le status
    const statusCheck = await this.shiftValidator.validateShiftStatus(shiftId, ShiftStatus.CLOSED);
    if (!statusCheck.valid) {
      throw new BadRequestException(statusCheck.message);
    }

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.VALIDATED,
      },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
        sales: true,
        cashRegister: true,
      },
    });
  }

  async findOne(id: string): Promise<Shift> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
            tank: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
            phone: true,
          },
        },
        sales: {
          include: {
            fuelType: true,
            payments: { include: { paymentMethod: true } },
          },
        },
        cashRegister: {
          include: {
            paymentDetails: { include: { paymentMethod: true } },
          },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift avec l'ID ${id} non trouvé`);
    }

    return shift;
  }

  async findByPompiste(pompisteId: string): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: { pompisteId },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findByStation(
    stationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: {
        nozzle: {
          dispenser: {
            stationId,
          },
        },
        ...(dateFrom || dateTo
          ? {
              startedAt: {
                ...(dateFrom && { gte: dateFrom }),
                ...(dateTo && { lte: dateTo }),
              },
            }
          : {}),
      },
      include: {
        nozzle: {
          include: {
            dispenser: true,
            fuelType: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findOpenShifts(stationId?: string): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: {
        status: ShiftStatus.OPEN,
        ...(stationId && {
          nozzle: {
            dispenser: {
              stationId,
            },
          },
        }),
      },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });
  }

  async findByNozzle(nozzleId: string): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: { nozzleId },
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
      orderBy: { startedAt: 'desc' },
    });
  }

  async findAll(filters: {
    stationId?: string;
    pompisteId?: string;
    status?: ShiftStatus;
    from?: Date;
    to?: Date;
  }): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: {
        ...(filters.pompisteId && { pompisteId: filters.pompisteId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.stationId && {
          nozzle: {
            dispenser: {
              stationId: filters.stationId,
            },
          },
        }),
        ...((filters.from || filters.to) && {
          startedAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }),
      },
      include: {
        nozzle: {
          include: {
            dispenser: { include: { station: true } },
            fuelType: true,
          },
        },
        pompiste: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeCode: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getShiftStatistics(shiftId: string): Promise<{
    quantitySold: number;
    revenue: number;
    salesCount: number;
    duration: { hours: number; minutes: number };
  }> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        indexStart: true,
        indexEnd: true,
        startedAt: true,
        endedAt: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(`Shift avec l'ID ${shiftId} non trouvé`);
    }

    const quantitySold = shift.indexEnd
      ? this.shiftCalculator.calculateQuantitySold(
          Number(shift.indexStart),
          Number(shift.indexEnd),
        )
      : 0;

    const revenueResult = await this.shiftCalculator.calculateRevenue(shiftId);
    const durationResult = this.shiftCalculator.calculateShiftDuration(
      shift.startedAt,
      shift.endedAt,
    );

    return {
      quantitySold,
      revenue: revenueResult.totalRevenue,
      salesCount: revenueResult.salesCount,
      duration: {
        hours: durationResult.hours,
        minutes: durationResult.minutes,
      },
    };
  }
}

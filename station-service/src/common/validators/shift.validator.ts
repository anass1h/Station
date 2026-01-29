import { Injectable } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/index.js';
import type {
  ValidationResult,
  IndexContinuityResult,
  OpenShiftResult,
} from './types.js';

@Injectable()
export class ShiftValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateIndexContinuity(
    nozzleId: string,
    indexStart: number,
  ): Promise<IndexContinuityResult> {
    // Récupérer le dernier shift CLOSED/VALIDATED sur ce nozzle
    const lastShift = await this.prisma.shift.findFirst({
      where: {
        nozzleId,
        status: { in: [ShiftStatus.CLOSED, ShiftStatus.VALIDATED] },
        indexEnd: { not: null },
      },
      orderBy: { endedAt: 'desc' },
    });

    if (!lastShift || lastShift.indexEnd === null) {
      return { valid: true };
    }

    const expectedIndex = Number(lastShift.indexEnd);
    const gap = indexStart - expectedIndex;

    // Tolérance de 0.5L
    if (gap > 0.5) {
      return {
        valid: false,
        message: `Écart d'index détecté: ${gap.toFixed(2)}L entre le dernier shift (${expectedIndex}) et l'index de début (${indexStart})`,
        expectedIndex,
        actualIndex: indexStart,
        gap,
      };
    }

    if (gap < -0.5) {
      return {
        valid: false,
        message: `Index de début (${indexStart}) inférieur à l'index de fin du dernier shift (${expectedIndex})`,
        expectedIndex,
        actualIndex: indexStart,
        gap,
      };
    }

    return { valid: true };
  }

  async validateNoOpenShift(nozzleId: string): Promise<OpenShiftResult> {
    const openShift = await this.prisma.shift.findFirst({
      where: {
        nozzleId,
        status: ShiftStatus.OPEN,
      },
    });

    if (openShift) {
      return {
        valid: false,
        message: `Un shift est déjà ouvert sur ce pistolet (ID: ${openShift.id})`,
        existingShiftId: openShift.id,
      };
    }

    return { valid: true };
  }

  async validateShiftOwnership(
    shiftId: string,
    userId: string,
  ): Promise<ValidationResult> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: { pompisteId: true },
    });

    if (!shift) {
      return {
        valid: false,
        message: `Shift avec l'ID ${shiftId} non trouvé`,
      };
    }

    if (shift.pompisteId !== userId) {
      return {
        valid: false,
        message: 'Ce shift ne vous appartient pas',
      };
    }

    return { valid: true };
  }

  async validateShiftStatus(
    shiftId: string,
    expectedStatus: ShiftStatus,
  ): Promise<ValidationResult> {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: { status: true },
    });

    if (!shift) {
      return {
        valid: false,
        message: `Shift avec l'ID ${shiftId} non trouvé`,
      };
    }

    if (shift.status !== expectedStatus) {
      return {
        valid: false,
        message: `Le shift doit être ${expectedStatus} (status actuel: ${shift.status})`,
      };
    }

    return { valid: true };
  }
}

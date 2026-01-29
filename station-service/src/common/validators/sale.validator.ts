import { Injectable } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/index.js';
import type {
  ValidationResult,
  PaymentTotalResult,
  PriceExistsResult,
} from './types.js';

@Injectable()
export class SaleValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateShiftOpen(shiftId: string): Promise<ValidationResult> {
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

    if (shift.status !== ShiftStatus.OPEN) {
      return {
        valid: false,
        message: `Impossible d'enregistrer une vente sur un shift ${shift.status}. Le shift doit être OPEN.`,
      };
    }

    return { valid: true };
  }

  validatePaymentTotal(
    totalAmount: number,
    payments: Array<{ amount: number }>,
  ): PaymentTotalResult {
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    // Tolérance de 0.01 pour les erreurs d'arrondi
    const difference = Math.abs(totalPayments - totalAmount);

    if (difference > 0.01) {
      return {
        valid: false,
        message: `Le total des paiements (${totalPayments.toFixed(2)} MAD) ne correspond pas au montant de la vente (${totalAmount.toFixed(2)} MAD)`,
        expected: totalAmount,
        actual: totalPayments,
        difference,
      };
    }

    return { valid: true };
  }

  async validatePriceExists(
    stationId: string,
    fuelTypeId: string,
  ): Promise<PriceExistsResult> {
    const activePrice = await this.prisma.price.findFirst({
      where: {
        stationId,
        fuelTypeId,
        effectiveTo: null,
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!activePrice) {
      return {
        valid: false,
        message: `Aucun prix actif trouvé pour ce type de carburant dans cette station`,
      };
    }

    return {
      valid: true,
      price: Number(activePrice.sellingPrice),
    };
  }

  async validatePaymentMethod(paymentMethodId: string): Promise<ValidationResult> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return {
        valid: false,
        message: `Moyen de paiement avec l'ID ${paymentMethodId} non trouvé`,
      };
    }

    if (!paymentMethod.isActive) {
      return {
        valid: false,
        message: `Le moyen de paiement "${paymentMethod.name}" est désactivé`,
      };
    }

    return { valid: true };
  }

  async validatePaymentReference(
    paymentMethodId: string,
    reference?: string,
  ): Promise<ValidationResult> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return {
        valid: false,
        message: `Moyen de paiement avec l'ID ${paymentMethodId} non trouvé`,
      };
    }

    if (paymentMethod.requiresReference && !reference) {
      return {
        valid: false,
        message: `Le moyen de paiement "${paymentMethod.name}" nécessite une référence`,
      };
    }

    return { valid: true };
  }
}

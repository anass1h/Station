import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';

export interface ShiftRevenueResult {
  totalRevenue: number;
  salesCount: number;
  totalQuantity: number;
}

export interface ShiftDurationResult {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

@Injectable()
export class ShiftCalculator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule la quantité vendue sur un shift
   */
  calculateQuantitySold(indexStart: number, indexEnd: number): number {
    return indexEnd - indexStart;
  }

  /**
   * Calcule le chiffre d'affaires d'un shift
   */
  async calculateRevenue(shiftId: string): Promise<ShiftRevenueResult> {
    const sales = await this.prisma.sale.findMany({
      where: { shiftId },
      select: {
        totalAmount: true,
        quantity: true,
      },
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const totalQuantity = sales.reduce(
      (sum, sale) => sum + Number(sale.quantity),
      0,
    );

    return {
      totalRevenue,
      salesCount: sales.length,
      totalQuantity,
    };
  }

  /**
   * Calcule la durée d'un shift
   */
  calculateShiftDuration(
    startedAt: Date,
    endedAt: Date | null,
  ): ShiftDurationResult {
    const end = endedAt || new Date();
    const diffMs = end.getTime() - startedAt.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      hours,
      minutes,
      totalMinutes,
    };
  }
}

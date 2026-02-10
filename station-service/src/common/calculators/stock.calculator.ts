import { Injectable } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/index.js';

export interface VarianceResult {
  theoretical: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface DaysRemainingResult {
  daysRemaining: number;
  currentLevel: number;
  avgDailyConsumption: number;
}

@Injectable()
export class StockCalculator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule le stock théorique basé sur les mouvements
   */
  async calculateTheoreticalStock(tankId: string): Promise<number> {
    const movements = await this.prisma.stockMovement.findMany({
      where: { tankId },
      select: {
        movementType: true,
        quantity: true,
      },
    });

    let theoreticalStock = 0;

    for (const movement of movements) {
      const quantity = Number(movement.quantity);

      switch (movement.movementType) {
        case MovementType.DELIVERY:
        case MovementType.CALIBRATION:
          // Les livraisons et calibrations positives ajoutent au stock
          theoreticalStock += quantity;
          break;
        case MovementType.SALE:
        case MovementType.LOSS:
          // Les ventes et pertes réduisent le stock
          theoreticalStock -= quantity;
          break;
        case MovementType.ADJUSTMENT:
          // Les ajustements peuvent être positifs ou négatifs (selon le signe de quantity)
          theoreticalStock += quantity;
          break;
      }
    }

    return theoreticalStock;
  }

  /**
   * Calcule l'écart entre stock théorique et réel
   */
  async calculateVariance(tankId: string): Promise<VarianceResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: { currentLevel: true },
    });

    if (!tank) {
      return {
        theoretical: 0,
        actual: 0,
        variance: 0,
        variancePercent: 0,
      };
    }

    const theoretical = await this.calculateTheoreticalStock(tankId);
    const actual = Number(tank.currentLevel);
    const variance = actual - theoretical;
    const variancePercent =
      theoretical !== 0 ? (variance / theoretical) * 100 : 0;

    return {
      theoretical,
      actual,
      variance,
      variancePercent,
    };
  }

  /**
   * Calcule le nombre de jours de stock restants
   */
  async calculateDaysRemaining(
    tankId: string,
    avgDailyConsumption?: number,
  ): Promise<DaysRemainingResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: { currentLevel: true },
    });

    if (!tank) {
      return {
        daysRemaining: 0,
        currentLevel: 0,
        avgDailyConsumption: 0,
      };
    }

    const currentLevel = Number(tank.currentLevel);
    let dailyConsumption = avgDailyConsumption;

    // Si pas de consommation fournie, calculer la moyenne des 30 derniers jours
    if (!dailyConsumption) {
      dailyConsumption = await this.calculateAvgDailyConsumption(tankId, 30);
    }

    const daysRemaining =
      dailyConsumption > 0 ? currentLevel / dailyConsumption : Infinity;

    return {
      daysRemaining: Number.isFinite(daysRemaining)
        ? Math.floor(daysRemaining)
        : 999,
      currentLevel,
      avgDailyConsumption: dailyConsumption,
    };
  }

  /**
   * Calcule la consommation moyenne journalière sur une période
   */
  private async calculateAvgDailyConsumption(
    tankId: string,
    days: number,
  ): Promise<number> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        tankId,
        movementType: { in: [MovementType.SALE, MovementType.LOSS] },
        createdAt: { gte: fromDate },
      },
      select: {
        quantity: true,
      },
    });

    const totalConsumption = movements.reduce(
      (sum, m) => sum + Number(m.quantity),
      0,
    );

    return totalConsumption / days;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import type { ValidationResult, CapacityResult, LevelResult } from './types.js';

@Injectable()
export class StockValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateTankCapacity(
    tankId: string,
    quantityToAdd: number,
  ): Promise<CapacityResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: {
        currentLevel: true,
        capacity: true,
        reference: true,
      },
    });

    if (!tank) {
      return {
        valid: false,
        message: `Cuve avec l'ID ${tankId} non trouvée`,
      };
    }

    const currentLevel = Number(tank.currentLevel);
    const capacity = Number(tank.capacity);
    const newLevel = currentLevel + quantityToAdd;

    if (newLevel > capacity) {
      const overflow = newLevel - capacity;
      return {
        valid: false,
        message: `La quantité à ajouter (${quantityToAdd}L) dépasse la capacité disponible. Niveau actuel: ${currentLevel}L, Capacité: ${capacity}L, Dépassement: ${overflow.toFixed(2)}L`,
        currentLevel,
        capacity,
        overflow,
      };
    }

    return { valid: true, currentLevel, capacity };
  }

  async validatePositiveLevel(
    tankId: string,
    quantityToRemove: number,
  ): Promise<LevelResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: {
        currentLevel: true,
        reference: true,
      },
    });

    if (!tank) {
      return {
        valid: false,
        message: `Cuve avec l'ID ${tankId} non trouvée`,
      };
    }

    const currentLevel = Number(tank.currentLevel);
    const newLevel = currentLevel - quantityToRemove;

    if (newLevel < 0) {
      const deficit = Math.abs(newLevel);
      return {
        valid: false,
        message: `Stock insuffisant. Niveau actuel: ${currentLevel}L, Quantité demandée: ${quantityToRemove}L, Déficit: ${deficit.toFixed(2)}L`,
        currentLevel,
        deficit,
      };
    }

    return { valid: true, currentLevel };
  }

  async validateTankExists(tankId: string): Promise<ValidationResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: { id: true, isActive: true },
    });

    if (!tank) {
      return {
        valid: false,
        message: `Cuve avec l'ID ${tankId} non trouvée`,
      };
    }

    if (!tank.isActive) {
      return {
        valid: false,
        message: 'Cette cuve est désactivée',
      };
    }

    return { valid: true };
  }

  async validateLowStockThreshold(tankId: string): Promise<{
    valid: boolean;
    isLow: boolean;
    currentLevel: number;
    lowThreshold: number;
  }> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: {
        currentLevel: true,
        lowThreshold: true,
      },
    });

    if (!tank) {
      return {
        valid: false,
        isLow: false,
        currentLevel: 0,
        lowThreshold: 0,
      };
    }

    const currentLevel = Number(tank.currentLevel);
    const lowThreshold = Number(tank.lowThreshold);

    return {
      valid: true,
      isLow: currentLevel <= lowThreshold,
      currentLevel,
      lowThreshold,
    };
  }

  async validateDeliveryLevels(
    tankId: string,
    levelBefore: number,
    levelAfter: number,
    quantity: number,
  ): Promise<ValidationResult> {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      select: {
        currentLevel: true,
        capacity: true,
      },
    });

    if (!tank) {
      return {
        valid: false,
        message: `Cuve avec l'ID ${tankId} non trouvée`,
      };
    }

    const capacity = Number(tank.capacity);

    // Vérifier que levelAfter <= capacity
    if (levelAfter > capacity) {
      return {
        valid: false,
        message: `Le niveau après livraison (${levelAfter}L) dépasse la capacité de la cuve (${capacity}L)`,
      };
    }

    // Vérifier la cohérence des niveaux
    const expectedDiff = levelAfter - levelBefore;
    const tolerance = quantity * 0.02; // 2% de tolérance

    if (Math.abs(expectedDiff - quantity) > tolerance) {
      return {
        valid: false,
        message: `Incohérence entre les niveaux déclarés (diff: ${expectedDiff}L) et la quantité livrée (${quantity}L)`,
      };
    }

    return { valid: true };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { Tank } from '@prisma/client';

interface TankRow {
  id: string;
  current_level: number;
  capacity: number;
  version: number;
}

/**
 * Service pour les opérations atomiques sur le stock des cuves.
 * Utilise SELECT FOR UPDATE pour le verrouillage pessimiste.
 */
@Injectable()
export class StockAtomicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Décrémente le stock de la cuve de manière atomique (vente).
   * Utilise SELECT FOR UPDATE pour verrouiller la ligne pendant la transaction.
   * Garantit qu'aucune lecture concurrente ne voit un état intermédiaire.
   */
  async decrementTankLevel(tankId: string, quantity: number): Promise<Tank> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verrouiller la ligne de la cuve (SELECT FOR UPDATE)
      const tanks = await tx.$queryRaw<TankRow[]>`
        SELECT id, current_level, capacity, version
        FROM tanks
        WHERE id = ${tankId}
        FOR UPDATE
      `;

      if (!tanks || tanks.length === 0) {
        throw new NotFoundException(`Cuve avec l'ID ${tankId} non trouvée`);
      }

      const tank = tanks[0];

      // 2. Vérifier le stock disponible
      const currentLevel = Number(tank.current_level);
      if (currentLevel < quantity) {
        throw new BadRequestException(
          `Stock insuffisant dans la cuve ${tankId} : demandé ${quantity}L, disponible ${currentLevel.toFixed(2)}L`,
        );
      }

      // 3. Mettre à jour le niveau (dans la transaction verrouillée)
      return tx.tank.update({
        where: { id: tankId },
        data: {
          currentLevel: { decrement: quantity },
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * Incrémente le stock de la cuve (livraison).
   * Vérifie la capacité maximale de la cuve.
   */
  async incrementTankLevel(tankId: string, quantity: number): Promise<Tank> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verrouiller la ligne de la cuve
      const tanks = await tx.$queryRaw<TankRow[]>`
        SELECT id, current_level, capacity, version
        FROM tanks
        WHERE id = ${tankId}
        FOR UPDATE
      `;

      if (!tanks || tanks.length === 0) {
        throw new NotFoundException(`Cuve avec l'ID ${tankId} non trouvée`);
      }

      const tank = tanks[0];
      const currentLevel = Number(tank.current_level);
      const capacity = Number(tank.capacity);

      // 2. Vérifier la capacité
      if (currentLevel + quantity > capacity) {
        throw new BadRequestException(
          `Dépassement de capacité de la cuve ${tankId} : actuel ${currentLevel.toFixed(2)}L + livraison ${quantity}L > capacité ${capacity.toFixed(2)}L`,
        );
      }

      // 3. Mettre à jour le niveau
      return tx.tank.update({
        where: { id: tankId },
        data: {
          currentLevel: { increment: quantity },
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * Ajuste le stock de la cuve (correction manuelle).
   * Peut incrémenter ou décrémenter selon le signe de la quantité.
   */
  async adjustTankLevel(
    tankId: string,
    newLevel: number,
    _reason: string,
  ): Promise<Tank> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verrouiller la ligne
      const tanks = await tx.$queryRaw<TankRow[]>`
        SELECT id, current_level, capacity, version
        FROM tanks
        WHERE id = ${tankId}
        FOR UPDATE
      `;

      if (!tanks || tanks.length === 0) {
        throw new NotFoundException(`Cuve avec l'ID ${tankId} non trouvée`);
      }

      const tank = tanks[0];
      const capacity = Number(tank.capacity);

      // 2. Valider le nouveau niveau
      if (newLevel < 0) {
        throw new BadRequestException(
          `Le niveau de stock ne peut pas être négatif : ${newLevel}L`,
        );
      }

      if (newLevel > capacity) {
        throw new BadRequestException(
          `Le niveau ${newLevel}L dépasse la capacité de la cuve ${capacity}L`,
        );
      }

      // 3. Mettre à jour le niveau avec la raison loggée
      return tx.tank.update({
        where: { id: tankId },
        data: {
          currentLevel: newLevel,
          version: { increment: 1 },
        },
      });
    });
  }

  /**
   * Mise à jour avec verrouillage optimiste.
   * Utilisé pour les opérations moins fréquentes où la détection de conflit suffit.
   */
  async updateWithOptimisticLock(
    tankId: string,
    expectedVersion: number,
    data: { currentLevel?: number },
  ): Promise<Tank> {
    const result = await this.prisma.tank.updateMany({
      where: {
        id: tankId,
        version: expectedVersion,
      },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        `Conflit de mise à jour sur la cuve ${tankId} : les données ont été modifiées par un autre utilisateur. Veuillez rafraîchir et réessayer.`,
      );
    }

    const tank = await this.prisma.tank.findUnique({ where: { id: tankId } });
    if (!tank) {
      throw new NotFoundException(`Cuve avec l'ID ${tankId} non trouvée`);
    }
    return tank;
  }
}

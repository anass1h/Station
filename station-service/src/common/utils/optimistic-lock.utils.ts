import { ConflictException } from '@nestjs/common';

/**
 * Interface pour les entités avec verrouillage optimiste.
 */
export interface VersionedEntity {
  version: number;
}

/**
 * Helper pour le verrouillage optimiste.
 *
 * Tente une mise à jour en vérifiant que la version en base correspond
 * à la version attendue par le client. Si un autre processus a modifié
 * la ressource entre-temps, la version a changé et l'update échoue.
 *
 * @param prismaModel - Le modèle Prisma (ex: tx.cashRegister)
 * @param id - L'identifiant de la ressource
 * @param expectedVersion - La version que le client connaît
 * @param data - Les données à mettre à jour
 * @param entityName - Nom de l'entité pour le message d'erreur
 * @returns Le nombre de lignes mises à jour (0 = conflit)
 */
export async function optimisticUpdate(
  prismaModel: {
    updateMany: (args: {
      where: { id: string; version: number };
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  },
  id: string,
  expectedVersion: number,
  data: Record<string, unknown>,
  entityName: string,
): Promise<number> {
  const result = await prismaModel.updateMany({
    where: {
      id,
      version: expectedVersion,
    },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new ConflictException(
      `Conflit de mise à jour sur ${entityName} (ID: ${id}). ` +
        `Les données ont été modifiées par un autre utilisateur. ` +
        `Veuillez rafraîchir et réessayer.`,
    );
  }

  return result.count;
}

/**
 * Vérifie la version avant une opération (sans update immédiat).
 * Utile quand on veut valider la version dans une transaction
 * avant d'exécuter plusieurs opérations.
 */
export function assertVersion(
  entity: VersionedEntity,
  expectedVersion: number,
  entityName: string,
  entityId: string,
): void {
  if (entity.version !== expectedVersion) {
    throw new ConflictException(
      `Conflit de version sur ${entityName} (ID: ${entityId}). ` +
        `Version attendue: ${expectedVersion}, version actuelle: ${entity.version}. ` +
        `Les données ont été modifiées. Veuillez rafraîchir et réessayer.`,
    );
  }
}

/**
 * Wrapper pour exécuter une mise à jour avec verrouillage optimiste
 * et retourner l'entité mise à jour.
 */
export async function withOptimisticLock<T>(
  prismaModel: {
    updateMany: (args: {
      where: { id: string; version: number };
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  },
  id: string,
  expectedVersion: number,
  data: Record<string, unknown>,
  entityName: string,
): Promise<T> {
  await optimisticUpdate(prismaModel, id, expectedVersion, data, entityName);

  const updated = await prismaModel.findUnique({ where: { id } });
  if (!updated) {
    throw new ConflictException(
      `${entityName} (ID: ${id}) non trouvé après la mise à jour.`,
    );
  }

  return updated;
}

import { UserRole } from '@prisma/client';

/**
 * Interface de l'utilisateur authentifié injecté par JwtStrategy.
 * Utilisé par tous les guards et décorateurs.
 * Source unique de vérité pour la structure du payload JWT.
 */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  badgeCode: string | null;
  role: UserRole;
  stationId: string | null;
}

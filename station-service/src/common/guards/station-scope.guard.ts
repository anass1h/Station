import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Interface pour typer l'utilisateur JWT
interface JwtUser {
  sub: string;
  role: string;
  stationId?: string | null;
}

// Extension de Request pour le typage
interface RequestWithUser extends Request {
  user?: JwtUser;
  stationScope?: string;
}

// Décorateur pour marquer les endpoints qui n'ont pas besoin de filtrage station
// (ex: /auth/login, /health, /licences pour SUPER_ADMIN)
export const SKIP_STATION_SCOPE = 'skipStationScope';
export const SkipStationScope = () => SetMetadata(SKIP_STATION_SCOPE, true);

@Injectable()
export class StationScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Vérifier si le décorateur @SkipStationScope() est appliqué
    const skipScope = this.reflector.getAllAndOverride<boolean>(
      SKIP_STATION_SCOPE,
      [context.getHandler(), context.getClass()],
    );
    if (skipScope) return true;

    // 2. Extraire l'utilisateur du JWT (injecté par JwtAuthGuard)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // 3. Pas d'utilisateur = pas de filtrage (le JwtAuthGuard gère déjà le 401)
    if (!user) return true;

    // 4. SUPER_ADMIN → bypass total (stationId null dans le JWT)
    if (user.role === 'SUPER_ADMIN') return true;

    // 5. Pour GESTIONNAIRE et POMPISTE → injecter stationId dans request
    if (user.stationId) {
      // Injecter le stationId forcé dans la requête
      // Les services le liront depuis request.stationScope
      request.stationScope = user.stationId;

      // Aussi forcer dans les query params pour les endpoints de liste
      if (request.query) {
        (request.query as Record<string, string>).stationId = user.stationId;
      }

      // Aussi forcer dans le body pour les endpoints de création
      if (request.body && typeof request.body === 'object') {
        (request.body as Record<string, string>).stationId = user.stationId;
      }
    }

    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenceService } from './licence.service';

export const SKIP_LICENCE_CHECK = 'skipLicenceCheck';

@Injectable()
export class LicenceGuard implements CanActivate {
  private readonly logger = new Logger(LicenceGuard.name);

  constructor(
    private readonly licenceService: LicenceService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Vérifier si le check de licence doit être ignoré
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_LICENCE_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url;

    // Exclure certains chemins
    const excludedPaths = [
      '/api/auth',
      '/api/health',
      '/api/licences',
      '/auth',
      '/health',
      '/licences',
    ];

    for (const excludedPath of excludedPaths) {
      if (path.startsWith(excludedPath)) {
        return true;
      }
    }

    // Récupérer l'utilisateur
    const user = request.user;

    if (!user) {
      // Pas d'utilisateur connecté, laisser JwtAuthGuard gérer
      return true;
    }

    // SUPER_ADMIN n'a pas besoin de licence
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Vérifier si l'utilisateur a une station
    const stationId = user.stationId;

    if (!stationId) {
      // Utilisateur sans station, autoriser (cas particulier)
      return true;
    }

    // Vérifier la licence de la station
    const result = await this.licenceService.checkLicence(stationId);

    if (!result.valid) {
      this.logger.warn(
        `Accès refusé pour station ${stationId}: ${result.reason}`,
      );
      throw new ForbiddenException(
        `Licence invalide: ${result.reason}. Veuillez contacter l'administrateur.`,
      );
    }

    // Avertir si la licence expire bientôt
    if (result.daysRemaining !== undefined && result.daysRemaining <= 7) {
      this.logger.warn(
        `Licence station ${stationId} expire dans ${result.daysRemaining} jours`,
      );
    }

    return true;
  }
}

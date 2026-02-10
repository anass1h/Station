import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthCronService {
  private readonly logger = new Logger(AuthCronService.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Supprime les refresh tokens expirés ou révoqués.
   * Exécuté tous les jours à 3h du matin.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleTokenCleanup(): Promise<void> {
    this.logger.log('Début du nettoyage des tokens expirés...');

    try {
      const count = await this.authService.cleanExpiredTokens();
      this.logger.log(`Nettoyage terminé : ${count} tokens supprimés`);
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des tokens', error);
    }
  }
}

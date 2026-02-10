import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Middleware qui assigne un identifiant unique à chaque requête entrante.
 * Le requestId est :
 * - Stocké dans request.requestId (accessible par les services)
 * - Ajouté dans le header de réponse X-Request-Id (visible par le client)
 * - Utilisé par le GlobalExceptionFilter pour la corrélation des logs
 *
 * Si le client envoie un header X-Request-Id, il est réutilisé (traçabilité
 * de bout en bout frontend → backend).
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const requestId = req.get('X-Request-Id') || randomUUID();

    // Stocker dans la requête pour accès par les autres couches
    req.requestId = requestId;

    // Envoyer dans la réponse pour corrélation côté client
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}

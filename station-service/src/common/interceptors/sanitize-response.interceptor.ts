import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Intercepteur global qui supprime récursivement les champs sensibles
 * de toutes les réponses API avant envoi au client.
 *
 * C'est une protection en profondeur (defense in depth) :
 * même si un service inclut passwordHash par erreur dans un include Prisma,
 * l'intercepteur le supprime avant l'envoi.
 */
const SENSITIVE_FIELDS = [
  'passwordHash',
  'pinCodeHash',
  'token', // Refresh token hash dans la table refresh_tokens
  'refreshToken', // Ne jamais retourner en lecture (seulement à la création)
];

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (typeof data === 'object' && data !== null) {
    // Handle Date, Decimal, etc.
    if (data instanceof Date) return data;
    if (typeof (data as Record<string, unknown>).toJSON === 'function')
      return data;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        continue; // Supprimer le champ
      }
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }

  return data;
}

@Injectable()
export class SanitizeResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => sanitize(data)));
  }
}

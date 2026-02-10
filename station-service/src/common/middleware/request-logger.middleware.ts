import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestWithContext extends Request {
  requestId?: string;
  user?: { id?: string };
}

/**
 * Middleware de logging de chaque requête entrante et sortante.
 * Log en JSON structuré avec le requestId, la durée et le status code.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = req.requestId || 'unknown';

    // Intercepter la fin de la réponse pour logger le résultat
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = req.user?.id || 'anonymous';
      const logLevel = res.statusCode >= 400 ? 'warn' : 'log';

      this.logger[logLevel](
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId,
          ip: req.ip,
        }),
      );
    });

    next();
  }
}

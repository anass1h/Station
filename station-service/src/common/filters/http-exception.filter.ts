import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface RequestWithContext extends Request {
  requestId?: string;
  user?: { id?: string };
}

/**
 * Filtre d'exception global.
 * - Uniformise le format de TOUTES les réponses d'erreur
 * - Log chaque erreur en JSON structuré
 * - Traduit les erreurs Prisma en erreurs HTTP compréhensibles
 * - Inclut le requestId pour la corrélation
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithContext>();
    const response = ctx.getResponse<Response>();

    const { status, message, error } = this.resolveException(exception);
    const requestId = request.requestId || 'unknown';
    const userId = request.user?.id || 'anonymous';

    // Log structuré en JSON
    const logPayload = {
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      statusCode: status,
      error,
      message,
      userId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= 500) {
      this.logger.error(JSON.stringify(logPayload));
      // En production, ne pas exposer les détails internes
      if (process.env.NODE_ENV === 'production') {
        response.status(status).json({
          statusCode: status,
          error: 'Internal Server Error',
          message: 'Une erreur interne est survenue. Veuillez réessayer.',
          requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(logPayload));
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    // 1. Exceptions HTTP NestJS (NotFoundException, BadRequest, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { status, message: response, error: exception.name };
      }

      const res = response as Record<string, unknown>;
      return {
        status,
        message: (res.message as string | string[]) || exception.message,
        error: (res.error as string) || exception.name,
      };
    }

    // 2. Erreurs Prisma — traduire en erreurs HTTP compréhensibles
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Données invalides pour la requête en base de données',
        error: 'Validation Error',
      };
    }

    // 3. Erreurs inconnues
    const errorMessage =
      exception instanceof Error ? exception.message : 'Erreur inconnue';
    this.logger.error(
      `Unhandled exception: ${errorMessage}`,
      exception instanceof Error ? exception.stack : '',
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: errorMessage,
      error: 'Internal Server Error',
    };
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (error.code) {
      case 'P2002': {
        // Violation de contrainte unique
        const target = (error.meta?.target as string[]) || [];
        const fields = target.join(', ');
        return {
          status: HttpStatus.CONFLICT,
          message: `Une ressource avec cette valeur existe déjà (champs: ${fields})`,
          error: 'Conflict',
        };
      }
      case 'P2003': {
        // Violation de clé étrangère
        const field = (error.meta?.field_name as string) || 'inconnu';
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Référence invalide : l'entité référencée par "${field}" n'existe pas`,
          error: 'Bad Request',
        };
      }
      case 'P2025': {
        // Enregistrement non trouvé
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Ressource non trouvée ou déjà supprimée',
          error: 'Not Found',
        };
      }
      case 'P2014': {
        // Violation de relation requise
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Impossible de supprimer : des ressources dépendantes existent',
          error: 'Bad Request',
        };
      }
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Erreur base de données (code: ${error.code})`,
          error: 'Database Error',
        };
    }
  }
}

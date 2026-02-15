import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { PaginationInterceptor } from './common/interceptors/pagination.interceptor.js';
import { SanitizeResponseInterceptor } from './common/interceptors/sanitize-response.interceptor.js';

async function bootstrap() {
  // Configuration des niveaux de log par environnement
  const logLevels: Record<string, LogLevel[]> = {
    development: ['log', 'error', 'warn', 'debug', 'verbose'],
    staging: ['log', 'error', 'warn'],
    production: ['error', 'warn'],
    test: ['error'],
  };

  const env = process.env.NODE_ENV || 'development';
  const levels = logLevels[env] || logLevels.development;

  const app = await NestFactory.create(AppModule, {
    logger: levels,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Filtre d'exception global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Intercepteurs globaux
  app.useGlobalInterceptors(
    new PaginationInterceptor(),
    new SanitizeResponseInterceptor(), // Protection contre fuite de données sensibles
  );

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
    }),
  );

  // CORS configuration
  const corsOrigins = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3001',
  );
  const allowedOrigins = corsOrigins.split(',').map((origin) => origin.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // ═══ SÉCURITÉ : En production, refuser les requêtes sans origine ═══
      if (!origin) {
        if (isProduction) {
          callback(new Error('Requêtes sans origine interdites en production'));
          return;
        }
        // En développement, autoriser (Postman, curl, etc.)
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        // ═══ SÉCURITÉ : Interdire le wildcard '*' en production ═══
        if (isProduction && allowedOrigins.includes('*')) {
          logger.error(
            'CORS_ORIGINS contient "*" en production — ceci est une faille de sécurité !',
          );
          callback(new Error('Wildcard CORS interdit en production'));
          return;
        }
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
      'X-Total-Pages',
      'X-Request-Id',
    ],
    credentials: true,
    maxAge: 900, // 24 hours
  });

  // Compression middleware
  app.use(compression());

  // Global validation pipe with enhanced options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: false, // Explicit types only — no silent coercion
      },
      forbidUnknownValues: true, // Reject unknown objects
      disableErrorMessages: isProduction,
    }),
  );

  // Global API prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Application running on port ${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`Log levels: ${levels.join(', ')}`);
  logger.log(`CORS origins: ${allowedOrigins.join(', ')}`);

  // ═══ Vérifications de sécurité au démarrage (production) ═══
  if (isProduction) {
    const jwtSecret = configService.get<string>('JWT_SECRET', '');
    if (jwtSecret.length < 32) {
      logger.error('JWT_SECRET trop court en production (min 32 caractères)');
      process.exit(1);
    }

    const trivialSecrets = [
      'secret',
      'changeme',
      'password',
      'jwt_secret',
      '123456',
    ];
    if (trivialSecrets.includes(jwtSecret.toLowerCase())) {
      logger.error('JWT_SECRET trivial détecté en production');
      process.exit(1);
    }

    if (allowedOrigins.includes('*')) {
      logger.error('CORS_ORIGINS wildcard "*" interdit en production');
      process.exit(1);
    }

    logger.log('✅ Vérifications de sécurité production passées');
  }
}
bootstrap();

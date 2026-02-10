import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { PaginationInterceptor } from './common/interceptors/pagination.interceptor';

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

  // Filtre d'exception global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Intercepteur de pagination global
  app.useGlobalInterceptors(new PaginationInterceptor());

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
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page', 'X-Total-Pages', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400, // 24 hours
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
        enableImplicitConversion: true, // Convert primitive types automatically
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
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
}
bootstrap();

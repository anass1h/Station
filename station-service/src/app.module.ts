import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/index.js';
import { HealthModule } from './health/index.js';
import { AuthModule } from './auth/index.js';
import { StationModule } from './station/index.js';
import { FuelTypeModule } from './fuel-type/index.js';
import { TankModule } from './tank/index.js';
import { DispenserModule } from './dispenser/index.js';
import { NozzleModule } from './nozzle/index.js';
import { ShiftModule } from './shift/index.js';
import { SaleModule } from './sale/index.js';
import { CashRegisterModule } from './cash-register/index.js';
import { SupplierModule } from './supplier/index.js';
import { DeliveryModule } from './delivery/index.js';
import { ClientModule } from './client/index.js';
import { InvoiceModule } from './invoice/index.js';
import { PriceModule } from './price/index.js';
import { PaymentMethodModule } from './payment-method/index.js';
import { AlertModule } from './alert/index.js';
import { AuditLogModule } from './audit-log/index.js';
import { DashboardModule } from './dashboard/index.js';
import { LicenceModule, LicenceGuard } from './licence/index.js';
import {
  CommonModule,
  CustomThrottlerGuard,
  StationScopeGuard,
  RequestIdMiddleware,
  RequestLoggerMiddleware,
} from './common/index.js';
import { PompisteDebtModule } from './pompiste-debt/index.js';
import { UserModule } from './user/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000), // 60 seconds
            limit: config.get<number>('THROTTLE_LIMIT', 100), // 100 requests
          },
        ],
      }),
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    StationModule,
    FuelTypeModule,
    TankModule,
    DispenserModule,
    NozzleModule,
    ShiftModule,
    SaleModule,
    CashRegisterModule,
    SupplierModule,
    DeliveryModule,
    ClientModule,
    InvoiceModule,
    PriceModule,
    PaymentMethodModule,
    AlertModule,
    AuditLogModule,
    DashboardModule,
    LicenceModule,
    PompisteDebtModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: StationScopeGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LicenceGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Ordre important : RequestId AVANT RequestLogger
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}

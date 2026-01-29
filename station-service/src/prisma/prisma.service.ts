import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (error) {
      this.logger.warn('Database connection failed - will retry on first query');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

   async testConnection() {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (e) {
      console.error('DB connection failed', e);
      return false;
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

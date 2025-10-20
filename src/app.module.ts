import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthRedirectMiddleware } from './common/middleware/auth-redirect.middleware';
import { LoggerMiddleware } from './common/middleware/logger.middlewart';
import { BasketModule } from './basket/basket.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule, BasketModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthRedirectMiddleware)
      .forRoutes('/profile')
      .apply(LoggerMiddleware).forRoutes('*')
  }

}

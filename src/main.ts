import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { UnauthorizedRedirectFilter } from '../src/common/filter/unauthorized-exception.filter';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new UnauthorizedRedirectFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  app.enableCors({
    origin: 'http://localhost:5173', // де працює фронтенд
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(3000);
  console.log(`Server running on http://localhost:3000`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS Configuration
  const configuredCors = configService.get<string>('CORS_ORIGIN');
  let corsOrigin: boolean | string[] = true;

  if (configuredCors && configuredCors !== '*') {
    corsOrigin = configuredCors.split(',').map((origin) => origin.trim());
  } else {
    // Reflect any requesting origin (required when credentials: true)
    corsOrigin = true;
  }

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  logger.log(`ChartDB Server running on http://0.0.0.0:${port}/api`);
  logger.log(`WebSocket Gateway available at ws://0.0.0.0:${port}`);
}

bootstrap();


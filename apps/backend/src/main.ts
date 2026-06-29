import './env';
import 'reflect-metadata';
import crypto from 'node:crypto';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { closeDb, db } from '@repo/database';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/app-exception-filter';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(helmet());

  app.useBodyParser('json', { limit: '1mb' });

  app.enableCors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID();
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  });

  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();

  const server = await app.listen(env.PORT);
  console.log(`Server running on http://localhost:${env.PORT}`);

  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close();
    closeDb(db);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();

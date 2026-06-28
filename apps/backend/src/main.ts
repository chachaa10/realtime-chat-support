import './env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(helmet());

  app.enableCors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(env.PORT);
  console.log(`Server running on http://localhost:${env.PORT}`);
}

bootstrap();

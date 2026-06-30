import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth/auth';
import { AppAuthModule } from './auth/auth.module';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { DatabaseModule } from './database/database.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'user', ttl: 60000, limit: 100 },
      { name: 'global', ttl: 60000, limit: 500 },
    ]),
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '1mb' },
        urlencoded: { enabled: true, extended: true },
      },
    }),
    AppAuthModule,
    DatabaseModule,
    TicketsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: UserThrottlerGuard }],
})
export class AppModule {}

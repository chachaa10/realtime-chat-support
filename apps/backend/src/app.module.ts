import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth/auth';
import { AppAuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
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
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth/auth';
import { AppAuthModule } from './auth/auth.module';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TicketsModule } from './tickets/tickets.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
      bodyParser: {
        json: { limit: '1mb' },
        urlencoded: { enabled: true, extended: true },
      },
    }),
    AppAuthModule,
    TicketsModule,
    MessagesModule,
    NotificationsModule,
    UploadModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor }],
})
export class AppModule {}

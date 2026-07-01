import { Module } from '@nestjs/common';

import { NOTIFICATION_BROADCASTER } from './notification-broadcaster';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, { provide: NOTIFICATION_BROADCASTER, useFactory: () => null }],
  exports: [NotificationsService, NOTIFICATION_BROADCASTER],
})
export class NotificationsModule {}

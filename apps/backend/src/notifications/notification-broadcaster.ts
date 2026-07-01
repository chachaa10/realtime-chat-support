export interface NotificationBroadcaster {
  notificationCreated(userId: string, notification: any): void;
}

export const NOTIFICATION_BROADCASTER = 'NOTIFICATION_BROADCASTER';

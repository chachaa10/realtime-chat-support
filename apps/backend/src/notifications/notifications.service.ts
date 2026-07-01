import { Injectable } from '@nestjs/common';
import { db, notifications } from '@repo/database';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export interface NotificationRow {
  id: number;
  userId: string;
  type: string;
  ticketId: number;
  message: string;
  isRead: number;
  createdAt: number;
}

const VALID_TYPES = ['ticket_assigned', 'ticket_resolved', 'ticket_cancelled', 'ticket_returned', 'new_message'] as const;

@Injectable()
export class NotificationsService {
  create(
    userId: string,
    type: string,
    ticketId: number,
    message: string,
  ): NotificationRow {
    if (!VALID_TYPES.includes(type as any)) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    const now = Date.now();
    const rows = db
      .insert(notifications)
      .values({
        userId,
        type,
        ticketId,
        message,
        createdAt: now,
      } as any)
      .returning()
      .all() as NotificationRow[];

    return rows[0];
  }

  findAll(userId: string): NotificationRow[] {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .all() as NotificationRow[];
  }

  getUnreadCount(userId: string): number {
    const rows = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)))
      .all() as { count: number }[];

    return rows[0]?.count ?? 0;
  }

  markRead(notificationId: number, userId: string): void {
    db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .run();
  }

  markAllRead(userId: string): void {
    db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)))
      .run();
  }

  markReadByTicket(ticketId: number, userId: string): void {
    db.update(notifications)
      .set({ isRead: 1 })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.ticketId, ticketId),
          eq(notifications.isRead, 0),
        ),
      )
      .run();
  }
}

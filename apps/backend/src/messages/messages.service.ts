import { Injectable, Inject } from '@nestjs/common';
import { db, tickets, messages, attachments, notifications as notificationsTable } from '@repo/database';
import { eq, and, asc, inArray } from 'drizzle-orm';
import type { Message } from '@repo/shared';

import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { NotFoundError, ForbiddenError } from '../common/errors';
import { MESSAGE_BROADCASTER, type MessageBroadcaster } from './message-broadcaster';
import { NOTIFICATION_BROADCASTER, type NotificationBroadcaster } from '../notifications/notification-broadcaster';

interface TicketRow {
  id: number
  status: string
  customerId: string
  agentId: string | null
}

interface AttachmentRow {
  id: number
  messageId: number | null
  ticketId: number
  uploaderId: string
  fileName: string
  fileSize: number
  mimeType: string
  filePath: string
  createdAt: number
}

export interface MessageWithAttachments extends Message {
  attachments: AttachmentRow[]
}

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MESSAGE_BROADCASTER) private readonly broadcaster: MessageBroadcaster,
    @Inject(NOTIFICATION_BROADCASTER) private readonly notificationBroadcaster: NotificationBroadcaster,
  ) {}

  getMessages(ticketId: number, user: AuthenticatedUser): MessageWithAttachments[] {
    this.checkTicketAccess(ticketId, user)

    const rows = db
      .select()
      .from(messages)
      .where(eq(messages.ticketId, ticketId))
      .orderBy(asc(messages.createdAt))
      .all() as Message[]

    return this.enrichWithAttachments(rows)
  }

  sendMessage(
    ticketId: number,
    user: AuthenticatedUser,
    body: string,
    attachmentIds?: number[],
  ): MessageWithAttachments {
    const ticket = this.checkTicketAccess(ticketId, user)

    if (user.role === 'customer' && (ticket.status === 'resolved' || ticket.status === 'cancelled')) {
      throw new ForbiddenError('Cannot send messages on resolved or cancelled tickets')
    }

    const now = Date.now()
    const rows = db
      .insert(messages)
      .values({
        ticketId,
        authorId: user.id,
        body,
        createdAt: now,
      })
      .returning()
      .all() as Message[]

    const message = rows[0]

    if (attachmentIds?.length) {
      for (const attachmentId of attachmentIds) {
        db
          .update(attachments)
          .set({ messageId: message.id })
          .where(
            and(
              eq(attachments.id, attachmentId),
              eq(attachments.uploaderId, user.id),
            ),
          )
          .run()
      }
    }

    const enriched = this.enrichWithAttachments([message])[0]
    this.broadcaster.messageSent(ticketId, enriched)

    const otherUserId = user.id === ticket.customerId ? ticket.agentId : ticket.customerId
    if (otherUserId) {
      const notifNow = Date.now()
      const notifRows = db
        .insert(notificationsTable)
        .values({ userId: otherUserId, type: 'new_message', ticketId, message: `New message on ticket #${ticketId}`, createdAt: notifNow } as any)
        .returning()
        .all()
      this.notificationBroadcaster.notificationCreated(otherUserId, notifRows[0])
    }

    return enriched
  }

  private enrichWithAttachments(msgs: Message[]): MessageWithAttachments[] {
    if (msgs.length === 0) return []

    const msgIds = msgs.map((m) => m.id)
    const attachRows = db
      .select()
      .from(attachments)
      .where(inArray(attachments.messageId, msgIds))
      .all() as AttachmentRow[]

    const attachMap = new Map<number, AttachmentRow[]>()
    for (const a of attachRows) {
      const list = attachMap.get(a.messageId!) ?? []
      list.push(a)
      attachMap.set(a.messageId!, list)
    }

    return msgs.map((m) => ({
      ...m,
      attachments: attachMap.get(m.id) ?? [],
    }))
  }

  private checkTicketAccess(ticketId: number, user: AuthenticatedUser): TicketRow {
    const rows = db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)
      .all() as TicketRow[]

    if (rows.length === 0) throw new NotFoundError('Ticket not found')

    const ticket = rows[0]

    if (user.role === 'customer' && ticket.customerId !== user.id) {
      throw new ForbiddenError('You can only access your own tickets')
    }

    return ticket
  }
}

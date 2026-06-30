import { Injectable, Inject } from '@nestjs/common';
import { db, tickets, messages } from '@repo/database';
import { eq, asc } from 'drizzle-orm';
import type { Message } from '@repo/shared';

import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { NotFoundError, ForbiddenError } from '../common/errors';
import { MESSAGE_BROADCASTER, type MessageBroadcaster } from './message-broadcaster';

interface TicketRow {
  id: number
  status: string
  customerId: string
  agentId: string | null
}

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MESSAGE_BROADCASTER) private readonly broadcaster: MessageBroadcaster,
  ) {}

  getMessages(ticketId: number, user: AuthenticatedUser): Message[] {
    this.checkTicketAccess(ticketId, user)

    const rows = db
      .select()
      .from(messages)
      .where(eq(messages.ticketId, ticketId))
      .orderBy(asc(messages.createdAt))
      .all() as Message[]

    return rows.map((m) => ({
      id: m.id,
      ticketId: m.ticketId,
      authorId: m.authorId,
      body: m.body,
      createdAt: m.createdAt,
    }))
  }

  sendMessage(ticketId: number, user: AuthenticatedUser, body: string): Message {
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
    this.broadcaster.messageSent(ticketId, message)

    return message
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

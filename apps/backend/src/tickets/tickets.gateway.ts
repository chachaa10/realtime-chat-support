import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import { db, profiles, tickets } from '@repo/database';
import { eq } from 'drizzle-orm';
import { Server, Socket } from 'socket.io';
import type { Message } from '@repo/shared';

import { auth } from '../auth/auth';
import type { TicketBroadcaster } from './ticket-broadcaster';
import type { MessageBroadcaster } from '../messages/message-broadcaster';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class TicketsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    TicketBroadcaster,
    MessageBroadcaster
{
  @WebSocketServer()
  server!: Server;

  afterInit() {
    console.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      let session;

      const cookie = client.handshake.headers?.cookie;
      if (cookie) {
        const headers = new Headers({ cookie });
        session = await auth.api.getSession({ headers });
      }

      if (!session?.user) {
        const token = client.handshake.auth?.token ?? client.handshake.query?.token;
        if (!token) {
          client.disconnect();
          return;
        }

        const headers = new Headers({ authorization: `Bearer ${token}` });
        session = await auth.api.getSession({ headers });
      }

      if (!session?.user) {
        client.disconnect();
        return;
      }

      const profileRows = db
        .select()
        .from(profiles)
        .where(eq(profiles.id, session.user.id))
        .limit(1)
        .all() as { id: string; role: string }[];

      const profile = profileRows[0] ?? null;

      (client as any).userId = session.user.id;
      (client as any).role = profile?.role ?? 'customer';
      (client as any).userName = session.user.name ?? 'Unknown';

      if (profile?.role === 'agent') {
        client.join('agents');
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // rooms auto-leave on disconnect
  }

  @SubscribeMessage('join:ticket')
  handleJoinTicket(client: Socket, payload: { ticketId: number }) {
    const { ticketId } = payload;
    const userId = (client as any).userId;
    const role = (client as any).role;

    if (!userId) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const ticketRows = db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)
      .all() as { id: number; customerId: string; status: string }[];

    if (ticketRows.length === 0) {
      client.emit('error', { code: 'NOT_FOUND', message: 'Ticket not found' });
      return;
    }

    const ticket = ticketRows[0];

    if (role === 'customer' && ticket.customerId !== userId) {
      client.emit('error', { code: 'FORBIDDEN', message: 'Access denied' });
      return;
    }

    client.join(`ticket:${ticketId}`);
  }

  @SubscribeMessage('leave:ticket')
  handleLeaveTicket(client: Socket, payload: { ticketId: number }) {
    client.leave(`ticket:${payload.ticketId}`);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, payload: { ticketId: number }) {
    const userId = (client as any).userId;
    const userName = (client as any).userName;
    if (!userId) return;
    client.to(`ticket:${payload.ticketId}`).emit('typing:start', {
      ticketId: payload.ticketId,
      userId,
      userName,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, payload: { ticketId: number }) {
    const userId = (client as any).userId;
    if (!userId) return;
    client.to(`ticket:${payload.ticketId}`).emit('typing:stop', {
      ticketId: payload.ticketId,
      userId,
    });
  }

  // --- TicketBroadcaster ---

  ticketCreated(ticket: any) {
    this.server?.to('agents')?.emit('ticket:new', { ticket });
  }

  ticketAccepted(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:accepted', { ticketId });
  }

  ticketResolved(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:resolved', { ticketId });
  }

  ticketCancelled(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:cancelled', { ticketId });
  }

  // --- MessageBroadcaster ---

  messageSent(ticketId: number, message: Message) {
    this.server?.to(`ticket:${ticketId}`)?.emit('message:sent', { message });
  }

  typingStart(ticketId: number, userId: string, userName: string) {
    this.server?.to(`ticket:${ticketId}`)?.emit('typing:start', { ticketId, userId, userName });
  }

  typingStop(ticketId: number, userId: string) {
    this.server?.to(`ticket:${ticketId}`)?.emit('typing:stop', { ticketId, userId });
  }
}

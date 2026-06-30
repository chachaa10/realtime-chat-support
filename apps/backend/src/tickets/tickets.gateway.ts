import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import { db, profiles } from '@repo/database';
import { eq } from 'drizzle-orm';
import { Server, Socket } from 'socket.io';

import { auth } from '../auth/auth';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class TicketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  afterInit() {
    console.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const session = await auth.api.getSession({
        headers: { authorization: `Bearer ${token}` },
      });

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

      const role = profileRows[0]?.role ?? 'customer';

      (client as any).userId = session.user.id;
      (client as any).role = role;

      if (role === 'agent') {
        client.join('agents');
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // rooms auto-leave on disconnect
  }

  emitTicketNew(ticket: any) {
    this.server?.to('agents')?.emit('ticket:new', { ticket });
  }

  emitTicketAccepted(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:accepted', { ticketId });
  }

  emitTicketResolved(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:resolved', { ticketId });
  }

  emitTicketCancelled(ticketId: number) {
    this.server?.to('agents')?.emit('ticket:cancelled', { ticketId });
  }
}

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
import type { TicketBroadcaster } from './ticket-broadcaster';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class TicketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, TicketBroadcaster
{
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

      const headers = new Headers({ authorization: `Bearer ${token}` });
      const session = await auth.api.getSession({ headers });

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
}

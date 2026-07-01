import { Injectable, Inject } from '@nestjs/common';
import { db, tickets, ticketLabels, labels, profiles, users, ticketEvents, notifications } from '@repo/database';
import { eq, and, inArray, sql, desc, asc, lt, gt } from 'drizzle-orm';

import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { NotFoundError, ForbiddenError, ConflictError } from '../common/errors';
import { TICKET_BROADCASTER, type TicketBroadcaster } from './ticket-broadcaster';
import { NOTIFICATION_BROADCASTER, type NotificationBroadcaster } from '../notifications/notification-broadcaster';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

const AGENT_MAX_CAPACITY = 8

interface CreateTicketInput {
  subject: string;
  description: string;
  labelIds?: number[];
}

export interface TicketRow {
  id: number;
  subject: string;
  description: string;
  status: string;
  customerId: string;
  agentId: string | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
  cancelledAt: number | null;
}

interface ProfileRow {
  id: string;
  role: string;
  createdAt: number;
}

export interface LabelRow {
  id: number;
  name: string;
  color: string;
}

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKET_BROADCASTER) private readonly broadcaster: TicketBroadcaster,
    @Inject(NOTIFICATION_BROADCASTER) private readonly notificationBroadcaster: NotificationBroadcaster,
  ) {}

  create(user: AuthenticatedUser, input: CreateTicketInput) {
    if (user.role !== 'customer') {
      throw new ForbiddenError('Only customers can create tickets');
    }

    const now = Date.now();
    const rows = db
      .insert(tickets)
      .values({
        subject: input.subject,
        description: input.description,
        status: 'open' as const,
        customerId: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all() as TicketRow[];

    const ticket = rows[0];

    this.recordEvent(ticket.id, null, 'open', user.id);

    if (input.labelIds?.length) {
      this.attachLabels(ticket.id, input.labelIds);
    }

    const result = this.formatTicketWithJoins(ticket, [], null, null);
    this.broadcaster.ticketCreated(result);

    return result;
  }

  findAll(
    user: AuthenticatedUser,
    options: {
      tab?: 'my' | 'queue';
      status?: string;
      label?: string | string[];
      sort?: string;
      cursor?: number;
      limit?: number;
    } = {},
  ): { tickets: any[]; cursor: number | null; hasMore: boolean } {
    const conditions: any[] = [];

    if (user.role === 'customer') {
      conditions.push(eq(tickets.customerId, user.id));
    } else if (options.tab === 'my') {
      conditions.push(eq(tickets.agentId, user.id));
      conditions.push(eq(tickets.status, 'in_progress'));
    } else {
      conditions.push(eq(tickets.status, 'open'));
      conditions.push(sql`${tickets.agentId} IS NULL`);
    }

    if (options.status) {
      conditions.push(eq(tickets.status, options.status as TicketStatus));
    }

    // Resolve label filter to SQL conditions for correct cursor pagination
    if (options.label) {
      const labelNames = Array.isArray(options.label) ? options.label : [options.label];
      const labelRows = db
        .select()
        .from(labels)
        .where(inArray(labels.name, labelNames))
        .all() as LabelRow[];
      if (labelRows.length > 0) {
        const labelIdList = labelRows.map((l) => l.id);
        const tlRows = db
          .select()
          .from(ticketLabels)
          .where(inArray(ticketLabels.labelId, labelIdList))
          .all() as { ticketId: number; labelId: number }[];
        if (tlRows.length > 0) {
          const matchingIds = [...new Set(tlRows.map((tl) => tl.ticketId))];
          conditions.push(inArray(tickets.id, matchingIds));
        } else {
          return { tickets: [], cursor: null, hasMore: false };
        }
      } else {
        return { tickets: [], cursor: null, hasMore: false };
      }
    }

    const orderByMap: Record<string, any> = {
      newest: desc(tickets.id),
      oldest: asc(tickets.id),
      status: [asc(tickets.status), desc(tickets.id)],
    };
    const order = orderByMap[options.sort ?? 'newest'];

    if (options.cursor) {
      if (options.sort === 'oldest') {
        conditions.push(gt(tickets.id, options.cursor));
      } else {
        conditions.push(lt(tickets.id, options.cursor));
      }
    }

    const limit = options.limit ?? 50;

    const rows = db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(order)
      .limit(limit + 1)
      .all() as TicketRow[];

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    const cursor = rows.length > 0 ? rows[rows.length - 1].id : null;
    const enriched = rows.map((row) => this.enrichTicket(row));

    return { tickets: enriched, cursor, hasMore };
  }

  findById(id: number, user: AuthenticatedUser) {
    const rows = db.select().from(tickets).where(eq(tickets.id, id)).limit(1).all() as TicketRow[];

    if (rows.length === 0) throw new NotFoundError('Ticket not found');

    const ticket = rows[0];

    if (user.role === 'customer' && ticket.customerId !== user.id) {
      throw new ForbiddenError('You can only view your own tickets');
    }

    return this.enrichTicket(ticket);
  }

  getEvents(id: number, user: AuthenticatedUser) {
    const rows = db.select().from(tickets).where(eq(tickets.id, id)).limit(1).all() as TicketRow[];

    if (rows.length === 0) throw new NotFoundError('Ticket not found');

    const ticket = rows[0];

    if (user.role === 'customer' && ticket.customerId !== user.id) {
      throw new ForbiddenError('You can only view your own tickets');
    }

    return db
      .select({
        id: ticketEvents.id,
        ticketId: ticketEvents.ticketId,
        fromStatus: ticketEvents.fromStatus,
        toStatus: ticketEvents.toStatus,
        actorId: ticketEvents.actorId,
        actorName: sql<string>`COALESCE(${users.name}, ${ticketEvents.actorId})`,
        createdAt: ticketEvents.createdAt,
      })
      .from(ticketEvents)
      .leftJoin(users, eq(ticketEvents.actorId, users.id))
      .where(eq(ticketEvents.ticketId, id))
      .orderBy(asc(ticketEvents.createdAt))
      .all();
  }

  accept(id: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') {
      throw new ForbiddenError('Only agents can accept tickets');
    }

    const profileRows = db
      .all(sql`SELECT status FROM profiles WHERE id = ${user.id} LIMIT 1`) as { status: string }[];

    if (profileRows[0]?.status === 'away') {
      throw new ConflictError('You are currently away');
    }

    const capacity = this.getCapacityStatus(user.id);
    if (capacity.atCapacity) {
      throw new ConflictError('You have reached your capacity limit');
    }

    const now = Date.now();
    const rows = db
      .update(tickets)
      .set({ status: 'in_progress' as const, agentId: user.id, updatedAt: now })
      .where(and(eq(tickets.id, id), eq(tickets.status, 'open' as const)))
      .returning()
      .all() as TicketRow[];

    if (rows.length === 0) {
      const current = db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1)
        .all() as TicketRow[];
      if (current.length === 0) throw new NotFoundError('Ticket not found');
      throw new ConflictError(
        current[0].status !== 'open'
          ? `Ticket is already ${current[0].status}`
          : 'Ticket is already assigned',
      );
    }

    this.recordEvent(id, 'open', 'in_progress', user.id);
    this.broadcaster.ticketAccepted(id);
    this.createNotification(rows[0].customerId, 'ticket_assigned', id, `Your ticket #${id} has been accepted`);
    return this.enrichTicket(rows[0]);
  }

  resolve(id: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') {
      throw new ForbiddenError('Only agents can resolve tickets');
    }

    const now = Date.now();
    const rows = db
      .update(tickets)
      .set({ status: 'resolved' as const, resolvedAt: now, updatedAt: now })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.agentId, user.id),
          eq(tickets.status, 'in_progress' as const),
        ),
      )
      .returning()
      .all() as TicketRow[];

    if (rows.length === 0) {
      const current = db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1)
        .all() as TicketRow[];
      if (current.length === 0) throw new NotFoundError('Ticket not found');
      if (current[0].status !== 'in_progress')
        throw new ConflictError(`Ticket is ${current[0].status}, not in_progress`);
      if (current[0].agentId !== user.id)
        throw new ForbiddenError('You can only resolve your own tickets');
      throw new ConflictError('Ticket is already assigned');
    }

    this.recordEvent(id, 'in_progress', 'resolved', user.id);
    this.broadcaster.ticketResolved(id);
    this.createNotification(rows[0].customerId, 'ticket_resolved', id, `Your ticket #${id} has been resolved`);
    return this.enrichTicket(rows[0]);
  }

  cancel(id: number, user: AuthenticatedUser) {
    if (user.role !== 'customer') {
      throw new ForbiddenError('Only customers can cancel tickets');
    }

    const now = Date.now();
    const rows = db
      .update(tickets)
      .set({ status: 'cancelled' as const, cancelledAt: now, updatedAt: now })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.customerId, user.id),
          eq(tickets.status, 'open' as const),
        ),
      )
      .returning()
      .all() as TicketRow[];

    if (rows.length === 0) {
      const current = db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1)
        .all() as TicketRow[];
      if (current.length === 0) throw new NotFoundError('Ticket not found');
      if (current[0].customerId !== user.id)
        throw new ForbiddenError('You can only cancel your own tickets');
      throw new ConflictError(`Ticket is ${current[0].status}, not open`);
    }

    this.recordEvent(id, 'open', 'cancelled', user.id);
    this.broadcaster.ticketCancelled(id);
    return this.enrichTicket(rows[0]);
  }

  returnToQueue(id: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') {
      throw new ForbiddenError('Only agents can return tickets');
    }

    const now = Date.now();
    const rows = db
      .update(tickets)
      .set({ status: 'open' as const, agentId: null, updatedAt: now })
      .where(
        and(
          eq(tickets.id, id),
          eq(tickets.agentId, user.id),
          eq(tickets.status, 'in_progress' as const),
        ),
      )
      .returning()
      .all() as TicketRow[];

    if (rows.length === 0) {
      const current = db
        .select()
        .from(tickets)
        .where(eq(tickets.id, id))
        .limit(1)
        .all() as TicketRow[];
      if (current.length === 0) throw new NotFoundError('Ticket not found');
      if (current[0].status !== 'in_progress')
        throw new ConflictError(`Ticket is ${current[0].status}, not in_progress`);
      if (current[0].agentId !== user.id)
        throw new ForbiddenError('You can only return your own tickets');
      throw new ConflictError('Ticket is already assigned');
    }

    this.recordEvent(id, 'in_progress', 'open', user.id);
    this.broadcaster.ticketReturnedToQueue(id);
    this.createNotification(rows[0].customerId, 'ticket_returned', id, `Your ticket #${id} has been returned to the queue`);
    return this.enrichTicket(rows[0]);
  }

  addLabel(ticketId: number, labelId: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') throw new ForbiddenError('Only agents can manage labels');

    const ticketExists = db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)
      .all();
    if (ticketExists.length === 0) throw new NotFoundError('Ticket not found');

    const labelExists = db
      .select({ id: labels.id })
      .from(labels)
      .where(eq(labels.id, labelId))
      .limit(1)
      .all();
    if (labelExists.length === 0) throw new NotFoundError('Label not found');

    try {
      db.insert(ticketLabels).values({ ticketId, labelId }).run();
    } catch {
      // ignore duplicate key violations
    }
  }

  removeLabel(ticketId: number, labelId: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') throw new ForbiddenError('Only agents can manage labels');

    db.delete(ticketLabels)
      .where(and(eq(ticketLabels.ticketId, ticketId), eq(ticketLabels.labelId, labelId)))
      .run();
  }

  listLabels(): LabelRow[] {
    return db.select().from(labels).orderBy(labels.name).all() as LabelRow[];
  }

  private attachLabels(ticketId: number, labelIds: number[]) {
    for (const labelId of labelIds) {
      try {
        db.insert(ticketLabels).values({ ticketId, labelId }).run();
      } catch {
        // skip invalid label IDs silently
      }
    }
  }

  private recordEvent(
    ticketId: number,
    fromStatus: string | null,
    toStatus: string,
    actorId: string,
  ) {
    const now = Date.now();
    db.run(
      sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${ticketId}, ${fromStatus}, ${toStatus}, ${actorId}, ${now})`,
    );
  }

  private enrichTicket(ticket: TicketRow) {
    const customerRows = db
      .select()
      .from(profiles)
      .where(eq(profiles.id, ticket.customerId))
      .limit(1)
      .all() as ProfileRow[];

    const customer = customerRows[0] ?? null;

    let agent: ProfileRow | null = null;
    if (ticket.agentId) {
      const agentRows = db
        .select()
        .from(profiles)
        .where(eq(profiles.id, ticket.agentId))
        .limit(1)
        .all() as ProfileRow[];
      agent = agentRows[0] ?? null;
    }

    const tlRows = db
      .select()
      .from(ticketLabels)
      .where(eq(ticketLabels.ticketId, ticket.id))
      .all() as { ticketId: number; labelId: number }[];

    let ticketLabelsList: LabelRow[] = [];
    if (tlRows.length > 0) {
      const labelIdList = tlRows.map((tl) => tl.labelId);
      ticketLabelsList = db
        .select()
        .from(labels)
        .where(inArray(labels.id, labelIdList))
        .all() as LabelRow[];
    }

    return this.formatTicketWithJoins(ticket, ticketLabelsList, customer, agent);
  }

  private createNotification(
    userId: string,
    type: 'ticket_assigned' | 'ticket_resolved' | 'ticket_cancelled' | 'ticket_returned',
    ticketId: number,
    message: string,
  ) {
    const now = Date.now();
    const rows = db
      .insert(notifications)
      .values({ userId, type, ticketId, message, createdAt: now } as any)
      .returning()
      .all() as any[];

    this.notificationBroadcaster.notificationCreated(userId, rows[0]);
  }

  getCapacityStatus(userId: string): { inProgressCount: number; maxCapacity: number; atCapacity: boolean } {
    const count = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tickets)
      .where(and(eq(tickets.agentId, userId), eq(tickets.status, 'in_progress' as const)))
      .all() as { count: number }[];

    const inProgressCount = count[0]?.count ?? 0;
    return {
      inProgressCount,
      maxCapacity: AGENT_MAX_CAPACITY,
      atCapacity: inProgressCount >= AGENT_MAX_CAPACITY,
    };
  }

  private formatTicketWithJoins(
    ticket: TicketRow,
    ticketLabelList: LabelRow[],
    customer: ProfileRow | null,
    agent: ProfileRow | null,
  ) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      customerId: ticket.customerId,
      agentId: ticket.agentId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      cancelledAt: ticket.cancelledAt,
      customer: customer ? { id: customer.id } : undefined,
      agent: agent ? { id: agent.id } : undefined,
      labels: ticketLabelList,
    };
  }
}

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { db, tickets, ticketLabels, labels, profiles } from '@repo/database';
import { eq, and, inArray, sql } from 'drizzle-orm';

import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard';
import { NotFoundError, ForbiddenError, ConflictError } from '../common/errors';
import { TicketsGateway } from './tickets.gateway';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

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
    @Inject(forwardRef(() => TicketsGateway))
    private readonly gateway: TicketsGateway,
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
    this.gateway.emitTicketNew(result);

    return result;
  }

  findAll(
    user: AuthenticatedUser,
    options: {
      tab?: 'my' | 'queue';
      status?: string;
      label?: string | string[];
    } = {},
  ): TicketRow[] {
    const conditions: any[] = [];

    if (user.role === 'customer') {
      conditions.push(eq(tickets.customerId, user.id));
    } else if (options.tab === 'my') {
      conditions.push(eq(tickets.agentId, user.id));
      conditions.push(eq(tickets.status, 'in_progress' as const));
    } else {
      conditions.push(eq(tickets.status, 'open' as const));
      conditions.push(sql`${tickets.agentId} IS NULL`);
    }

    if (options.status) {
      conditions.push(eq(tickets.status, options.status as TicketStatus));
    }

    let rows = db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(tickets.createdAt)
      .all() as TicketRow[];

    if (options.label) {
      const labelNames = Array.isArray(options.label) ? options.label : [options.label];
      const labelRows = db
        .select()
        .from(labels)
        .where(inArray(labels.name, labelNames))
        .all() as LabelRow[];
      if (labelRows.length > 0) {
        const labelIdSet = new Set(labelRows.map((l) => l.id));
        const tlRows = db
          .select()
          .from(ticketLabels)
          .where(inArray(ticketLabels.labelId, [...labelIdSet]))
          .all() as { ticketId: number; labelId: number }[];
        const matchingTicketIds = new Set(tlRows.map((tl) => tl.ticketId));
        rows = rows.filter((t) => matchingTicketIds.has(t.id));
      } else {
        return [];
      }
    }

    return rows;
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

  accept(id: number, user: AuthenticatedUser) {
    if (user.role !== 'agent') {
      throw new ForbiddenError('Only agents can accept tickets');
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
    this.gateway.emitTicketAccepted(id);
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
    this.gateway.emitTicketResolved(id);
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
    this.gateway.emitTicketCancelled(id);
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

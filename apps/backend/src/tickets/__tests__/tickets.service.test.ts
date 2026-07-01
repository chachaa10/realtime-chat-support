import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@repo/shared', async (importOriginal) => {
  const dbPath = join(tmpdir(), `test-${randomUUID()}.db`);
  process.env.DATABASE_PATH = dbPath;
  const actual = await importOriginal();
  return {
    ...actual,
    env: new Proxy({} as Record<string, unknown>, {
      get(_, prop) {
        if (prop === 'DATABASE_PATH') return dbPath;
        if (prop === 'PORT') return 3098;
        if (prop === 'CORS_ORIGIN') return 'http://localhost:5173';
        if (prop === 'BETTER_AUTH_SECRET') return 'test-secret-that-is-at-least-thirty-two-chars!!';
        if (prop === 'BETTER_AUTH_URL') return 'http://localhost:3098';
        if (prop === 'UPLOAD_DIR') return 'uploads';
        return undefined;
      },
    }),
  };
});

import { Test, type TestingModule } from '@nestjs/testing';
import { db } from '@repo/database';
import { sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { AuthenticatedUser } from '../../auth/guards/jwt-auth.guard';
import { TICKET_BROADCASTER, type TicketBroadcaster } from '../ticket-broadcaster';
import { NOTIFICATION_BROADCASTER } from '../../notifications/notification-broadcaster';
import { TicketsService } from '../tickets.service';

let service: TicketsService;

const customer: AuthenticatedUser = {
  id: `cust_${randomUUID().slice(0, 12)}`,
  name: 'Alice',
  email: 'alice@test.com',
  role: 'customer',
};

const otherCustomer: AuthenticatedUser = {
  id: `cust_${randomUUID().slice(0, 12)}`,
  name: 'Eve',
  email: 'eve@test.com',
  role: 'customer',
};

const agent: AuthenticatedUser = {
  id: `agent_${randomUUID().slice(0, 12)}`,
  name: 'Bob',
  email: 'bob@test.com',
  role: 'agent',
};

const otherAgent: AuthenticatedUser = {
  id: `agent_${randomUUID().slice(0, 12)}`,
  name: 'Charlie',
  email: 'charlie@test.com',
  role: 'agent',
};

function createTables() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
      email_verified integer DEFAULT false NOT NULL, image text,
      created_at integer NOT NULL, updated_at integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY, expires_at integer NOT NULL,
      token text NOT NULL UNIQUE, created_at integer NOT NULL,
      updated_at integer NOT NULL, ip_address text, user_agent text,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token text, refresh_token text, id_token text,
      access_token_expires_at integer, refresh_token_expires_at integer,
      scope text, password text,
      created_at integer NOT NULL, updated_at integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS verifications (
      id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
      expires_at integer NOT NULL, created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS profiles (
      id text PRIMARY KEY, role text NOT NULL,
      status text NOT NULL DEFAULT 'online',
      created_at integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS tickets (
      id integer PRIMARY KEY AUTOINCREMENT, subject text NOT NULL,
      description text NOT NULL, status text NOT NULL DEFAULT 'open',
      customer_id text NOT NULL REFERENCES profiles(id),
      agent_id text REFERENCES profiles(id),
      created_at integer NOT NULL, updated_at integer NOT NULL,
      resolved_at integer, cancelled_at integer
    )`,
    `CREATE TABLE IF NOT EXISTS ticket_events (
      id integer PRIMARY KEY AUTOINCREMENT, ticket_id integer NOT NULL REFERENCES tickets(id),
      from_status text, to_status text NOT NULL,
      actor_id text NOT NULL REFERENCES profiles(id),
      reason text, created_at integer NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS labels (
      id integer PRIMARY KEY AUTOINCREMENT, name text NOT NULL UNIQUE, color text NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS ticket_labels (
      ticket_id integer NOT NULL REFERENCES tickets(id),
      label_id integer NOT NULL REFERENCES labels(id),
      PRIMARY KEY (ticket_id, label_id)
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL REFERENCES profiles(id),
      type text NOT NULL,
      ticket_id integer NOT NULL REFERENCES tickets(id),
      message text NOT NULL,
      is_read integer NOT NULL DEFAULT 0,
      created_at integer NOT NULL
    )`,
  ];
  for (const s of stmts) db.run(s);
}

beforeAll(async () => {
  createTables();

  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${customer.id}, 'customer', ${Date.now()})`,
  );
  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${otherCustomer.id}, 'customer', ${Date.now()})`,
  );
  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${agent.id}, 'agent', ${Date.now()})`,
  );
  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${otherAgent.id}, 'agent', ${Date.now()})`,
  );
  db.run(sql`INSERT INTO labels (name, color) VALUES ('billing', '#3b82f6')`);

  const mockBroadcaster: TicketBroadcaster = {
    ticketCreated: vi.fn(),
    ticketAccepted: vi.fn(),
    ticketResolved: vi.fn(),
    ticketCancelled: vi.fn(),
    ticketReturnedToQueue: vi.fn(),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      TicketsService,
      { provide: TICKET_BROADCASTER, useValue: mockBroadcaster },
      { provide: NOTIFICATION_BROADCASTER, useValue: { notificationCreated: vi.fn() } },
    ],
  }).compile();

  service = moduleRef.get(TicketsService);
});

afterAll(async () => {
  const dbPath = process.env.DATABASE_PATH;
  if (dbPath && dbPath !== ':memory:') {
    try {
      unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  }
});

describe('create', () => {
  it('customer can create a ticket', () => {
    const ticket = service.create(customer, {
      subject: 'Cannot login',
      description: 'Unable to access my account',
    });

    expect(ticket).toMatchObject({
      subject: 'Cannot login',
      description: 'Unable to access my account',
      status: 'open',
    });
    expect(ticket.id).toBeGreaterThan(0);
  });

  it('rejects agent from creating a ticket', () => {
    expect(() => service.create(agent, { subject: 'Test', description: 'Test' })).toThrow(
      'Only customers can create tickets',
    );
  });
});

describe('findAll', () => {
  it('customer sees only their own tickets', () => {
    service.create(customer, { subject: 'My issue', description: 'Help me' });
    service.create(otherCustomer, { subject: 'Other issue', description: 'Help them' });

    const tickets = service.findAll(customer);
    expect(tickets.every((t) => t.customerId === customer.id)).toBe(true);
  });

  it('agent sees open tickets in queue', () => {
    const tickets = service.findAll(agent);
    expect(tickets.every((t) => t.status === 'open')).toBe(true);
  });
});

describe('findById', () => {
  it('customer can view their own ticket', () => {
    const created = service.create(customer, { subject: 'Detail', description: 'Check me' });
    const found = service.findById(created.id, customer);
    expect(found.id).toBe(created.id);
  });

  it('customer cannot view another customer ticket', () => {
    const created = service.create(otherCustomer, { subject: 'Private', description: 'Secret' });
    expect(() => service.findById(created.id, customer)).toThrow(
      'You can only view your own tickets',
    );
  });

  it('agent can view any ticket', () => {
    const created = service.create(otherCustomer, { subject: 'Any', description: 'Visible' });
    const found = service.findById(created.id, agent);
    expect(found.id).toBe(created.id);
  });
});

describe('accept', () => {
  it('agent can accept an open ticket', () => {
    const ticket = service.create(customer, { subject: 'Accept me', description: 'Please' });
    const accepted = service.accept(ticket.id, agent);
    expect(accepted.status).toBe('in_progress');
    expect(accepted.agentId).toBe(agent.id);
  });

  it('customer cannot accept a ticket', () => {
    const ticket = service.create(customer, { subject: 'No accept', description: 'Nope' });
    expect(() => service.accept(ticket.id, customer)).toThrow('Only agents can accept tickets');
  });

  it('cannot accept already accepted ticket', () => {
    const ticket = service.create(customer, { subject: 'Taken', description: 'Already' });
    service.accept(ticket.id, agent);
    expect(() => service.accept(ticket.id, otherAgent)).toThrow(/already/);
  });

  it('rejects accept when agent is at capacity', () => {
    const tickets: number[] = []
    for (let i = 0; i < 8; i++) {
      const t = service.create(otherCustomer, { subject: `Capacity ${i}`, description: 'X' })
      tickets.push(service.accept(t.id, otherAgent).id)
    }

    const overflow = service.create(otherCustomer, { subject: 'Overflow', description: 'X' })
    expect(() => service.accept(overflow.id, otherAgent)).toThrow('capacity limit')
  });

  it('rejects accept when agent is away', () => {
    db.run(sql`UPDATE profiles SET status = 'away' WHERE id = ${agent.id}`);
    const ticket = service.create(customer, { subject: 'Away test', description: 'X' });
    expect(() => service.accept(ticket.id, agent)).toThrow('away');
    db.run(sql`UPDATE profiles SET status = 'online' WHERE id = ${agent.id}`);
  });
});

describe('resolve', () => {
  it('assigned agent can resolve an in_progress ticket', () => {
    const ticket = service.create(customer, { subject: 'Resolve me', description: 'Done' });
    service.accept(ticket.id, agent);
    const resolved = service.resolve(ticket.id, agent);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeGreaterThan(0);
  });

  it('non-assigned agent cannot resolve', () => {
    const ticket = service.create(customer, { subject: 'Not mine', description: 'Nope' });
    service.accept(ticket.id, agent);
    expect(() => service.resolve(ticket.id, otherAgent)).toThrow(
      'You can only resolve your own tickets',
    );
  });

  it('cannot resolve an open ticket', () => {
    const ticket = service.create(customer, { subject: 'Fresh', description: 'New' });
    expect(() => service.resolve(ticket.id, agent)).toThrow(/not in_progress/);
  });

  it('customer cannot resolve a ticket', () => {
    const ticket = service.create(customer, { subject: 'Customer no resolve', description: 'X' });
    expect(() => service.resolve(ticket.id, customer)).toThrow('Only agents can resolve tickets');
  });
});

describe('cancel', () => {
  it('customer can cancel their open ticket', () => {
    const ticket = service.create(customer, { subject: 'Cancel me', description: 'Nevermind' });
    const cancelled = service.cancel(ticket.id, customer);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeGreaterThan(0);
  });

  it('customer cannot cancel another customer ticket', () => {
    const ticket = service.create(otherCustomer, { subject: 'Not yours', description: 'Nope' });
    expect(() => service.cancel(ticket.id, customer)).toThrow(
      'You can only cancel your own tickets',
    );
  });

  it('agent cannot cancel a ticket', () => {
    const ticket = service.create(customer, { subject: 'No cancel', description: 'By agent' });
    expect(() => service.cancel(ticket.id, agent)).toThrow('Only customers can cancel tickets');
  });

  it('cannot cancel a resolved ticket', () => {
    const ticket = service.create(customer, { subject: 'Done deal', description: 'Finished' });
    service.accept(ticket.id, agent);
    service.resolve(ticket.id, agent);
    expect(() => service.cancel(ticket.id, customer)).toThrow(/not open/);
  });
});

describe('returnToQueue', () => {
  it('assigned agent can return an in_progress ticket to queue', () => {
    const ticket = service.create(customer, { subject: 'Return me', description: 'Please' });
    service.accept(ticket.id, agent);
    const returned = service.returnToQueue(ticket.id, agent);
    expect(returned.status).toBe('open');
    expect(returned.agentId).toBeNull();
  });

  it('non-assigned agent cannot return a ticket', () => {
    const ticket = service.create(customer, { subject: 'Not mine', description: 'Nope' });
    service.accept(ticket.id, agent);
    expect(() => service.returnToQueue(ticket.id, otherAgent)).toThrow(
      'You can only return your own tickets',
    );
  });

  it('cannot return an open ticket', () => {
    const ticket = service.create(customer, { subject: 'Fresh', description: 'New' });
    expect(() => service.returnToQueue(ticket.id, agent)).toThrow(/not in_progress/);
  });

  it('cannot return a resolved ticket', () => {
    const ticket = service.create(customer, { subject: 'Done', description: 'Finished' });
    service.accept(ticket.id, agent);
    service.resolve(ticket.id, agent);
    expect(() => service.returnToQueue(ticket.id, agent)).toThrow(/not in_progress/);
  });

  it('customer cannot return a ticket', () => {
    const ticket = service.create(customer, { subject: 'No return', description: 'By customer' });
    service.accept(ticket.id, agent);
    expect(() => service.returnToQueue(ticket.id, customer)).toThrow('Only agents can return tickets');
  });

  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.returnToQueue(999999, agent)).toThrow('Ticket not found');
  });
});

describe('findById - not found', () => {
  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.findById(999999, customer)).toThrow('Ticket not found');
  });
});

describe('accept - not found / errors', () => {
  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.accept(999999, agent)).toThrow('Ticket not found');
  });
});

describe('resolve - not found / errors', () => {
  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.resolve(999999, agent)).toThrow('Ticket not found');
  });
});

describe('cancel - not found', () => {
  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.cancel(999999, customer)).toThrow('Ticket not found');
  });
});

describe('addLabel', () => {
  it('agent can add a label to an existing ticket', () => {
    const ticket = service.create(customer, { subject: 'Label test', description: 'X' });
    const labels = service.listLabels();
    expect(labels.length).toBeGreaterThan(0);
    service.addLabel(ticket.id, labels[0].id, agent);
    // no throw = success (duplicate labels are silently ignored)
  });

  it('throws ForbiddenError for non-agent', () => {
    expect(() => service.addLabel(1, 1, customer)).toThrow('Only agents can manage labels');
  });

  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.addLabel(999999, 1, agent)).toThrow('Ticket not found');
  });

  it('throws NotFoundError for non-existent label', () => {
    const ticket = service.create(customer, { subject: 'Bad label', description: 'X' });
    expect(() => service.addLabel(ticket.id, 999999, agent)).toThrow('Label not found');
  });

  it('silently ignores duplicate label additions', () => {
    const ticket = service.create(customer, { subject: 'Duplicate label', description: 'X' });
    const labels = service.listLabels();
    service.addLabel(ticket.id, labels[0].id, agent);
    // second insertion triggers catch block
    service.addLabel(ticket.id, labels[0].id, agent);
  });
});

describe('removeLabel', () => {
  it('agent can remove a label without throwing', () => {
    const ticket = service.create(customer, { subject: 'Remove label', description: 'X' });
    const labels = service.listLabels();
    service.addLabel(ticket.id, labels[0].id, agent);
    service.removeLabel(ticket.id, labels[0].id, agent);
    // no throw = success
  });

  it('throws ForbiddenError for non-agent', () => {
    expect(() => service.removeLabel(1, 1, customer)).toThrow('Only agents can manage labels');
  });

  it('silently succeeds when label not attached', () => {
    service.removeLabel(999999, 999999, agent);
    // no throw = success
  });
});

describe('listLabels', () => {
  it('returns all labels ordered by name', () => {
    const allLabels = service.listLabels();
    expect(Array.isArray(allLabels)).toBe(true);
    expect(allLabels.length).toBeGreaterThanOrEqual(1);
  });
});

describe('findAll - additional filters', () => {
  it('agent can view their own in_progress tickets with tab=my', () => {
    const ticket = service.create(customer, { subject: 'My assigned', description: 'X' });
    service.accept(ticket.id, agent);
    const results = service.findAll(agent, { tab: 'my' });
    expect(results.every((t) => t.agentId === agent.id && t.status === 'in_progress')).toBe(true);
  });

  it('filters by status', () => {
    const results = service.findAll(agent, { status: 'open' });
    expect(results.every((t) => t.status === 'open')).toBe(true);
  });

  it('filters tickets by label name', () => {
    const ticket = service.create(customer, { subject: 'Label filter', description: 'X' });
    const allLabels = service.listLabels();
    service.addLabel(ticket.id, allLabels[0].id, agent);
    const results = service.findAll(agent, { label: allLabels[0].name });
    expect(results.some((t) => t.id === ticket.id)).toBe(true);
  });

  it('returns empty when label filter matches nothing', () => {
    const results = service.findAll(agent, { label: 'non-existent-label' });
    expect(results).toEqual([]);
  });
});

describe('create with labelIds', () => {
  it('attaches labels when creating a ticket', () => {
    const allLabels = service.listLabels();
    const ticket = service.create(customer, {
      subject: 'With labels',
      description: 'X',
      labelIds: allLabels.map((l) => l.id),
    });
    const enriched = service.findById(ticket.id, customer);
    expect(enriched.labels.length).toBeGreaterThanOrEqual(1);
  });

  it('silently skips invalid label IDs', () => {
    const ticket = service.create(customer, {
      subject: 'Bad labels',
      description: 'X',
      labelIds: [999999],
    });
    expect(ticket.id).toBeGreaterThan(0);
  });
});

describe('getEvents', () => {
  it('returns events for a ticket', () => {
    const ticket = service.create(customer, { subject: 'Event test', description: 'X' });
    service.accept(ticket.id, agent);
    service.resolve(ticket.id, agent);
    const events = service.getEvents(ticket.id, customer);
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0]).toMatchObject({ ticketId: ticket.id, toStatus: 'open' });
  });

  it('customer can only see their own ticket events', () => {
    const ticket = service.create(otherCustomer, { subject: 'Private', description: 'X' });
    expect(() => service.getEvents(ticket.id, customer)).toThrow(
      'You can only view your own tickets',
    );
  });

  it('agent can see any ticket events', () => {
    const ticket = service.create(customer, { subject: 'Agent view', description: 'X' });
    const events = service.getEvents(ticket.id, agent);
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('returns events ordered by created_at asc', () => {
    const ticket = service.create(customer, { subject: 'Order test', description: 'X' });
    const events = service.getEvents(ticket.id, agent);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].createdAt).toBeGreaterThanOrEqual(events[i - 1].createdAt);
    }
  });

  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.getEvents(999999, customer)).toThrow('Ticket not found');
  });
});

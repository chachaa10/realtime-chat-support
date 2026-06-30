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
import { DatabaseModule } from '../../database/database.module';
import { TicketsGateway } from '../tickets.gateway';
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

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [DatabaseModule],
    providers: [TicketsService, TicketsGateway],
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

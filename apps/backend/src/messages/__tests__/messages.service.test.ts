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
import { db, tickets, messages, attachments } from '@repo/database';
import { eq, sql } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { AuthenticatedUser } from '../../auth/guards/jwt-auth.guard';
import { NOTIFICATION_BROADCASTER } from '../../notifications/notification-broadcaster';
import { MESSAGE_BROADCASTER, type MessageBroadcaster } from '../message-broadcaster';
import { MessagesService } from '../messages.service';

let service: MessagesService;

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
    `CREATE TABLE IF NOT EXISTS messages (
      id integer PRIMARY KEY AUTOINCREMENT, ticket_id integer NOT NULL REFERENCES tickets(id),
      author_id text NOT NULL REFERENCES profiles(id),
      body text NOT NULL, created_at integer NOT NULL,
      status text NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read'))
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
    `CREATE TABLE IF NOT EXISTS attachments (
      id integer PRIMARY KEY AUTOINCREMENT, message_id integer REFERENCES messages(id),
      ticket_id integer NOT NULL REFERENCES tickets(id),
      uploader_id text NOT NULL REFERENCES profiles(id),
      file_name text NOT NULL, file_size integer NOT NULL,
      mime_type text NOT NULL, file_path text NOT NULL,
      created_at integer NOT NULL
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

function createTicket() {
  const now = Date.now();
  const rows = db
    .insert(tickets)
    .values({
      subject: 'Test ticket',
      description: 'Help needed',
      status: 'open' as const,
      customerId: customer.id,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .all() as { id: number }[];
  return rows[0].id;
}

function assignTicket(ticketId: number) {
  db.run(
    sql`UPDATE tickets SET status = 'in_progress', agent_id = ${agent.id} WHERE id = ${ticketId}`,
  );
}

function resolveTicket(ticketId: number) {
  const now = Date.now();
  db.run(
    sql`UPDATE tickets SET status = 'resolved', resolved_at = ${now}, updated_at = ${now} WHERE id = ${ticketId}`,
  );
}

function cancelTicket(ticketId: number) {
  const now = Date.now();
  db.run(
    sql`UPDATE tickets SET status = 'cancelled', cancelled_at = ${now}, updated_at = ${now} WHERE id = ${ticketId}`,
  );
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

  const mockBroadcaster: MessageBroadcaster = {
    messageSent: vi.fn(),
    messageStatusUpdated: vi.fn(),
    typingStart: vi.fn(),
    typingStop: vi.fn(),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      MessagesService,
      { provide: MESSAGE_BROADCASTER, useValue: mockBroadcaster },
      { provide: NOTIFICATION_BROADCASTER, useValue: { notificationCreated: vi.fn() } },
    ],
  }).compile();

  service = moduleRef.get(MessagesService);
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

describe('getMessages', () => {
  it('returns empty array for a ticket with no messages', () => {
    const ticketId = createTicket();
    const result = service.getMessages(ticketId, customer);
    expect(result.messages).toEqual([]);
    expect(result.cursor).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it('customer can view messages on their own ticket', () => {
    const ticketId = createTicket();
    service.sendMessage(ticketId, customer, 'Hello');
    const result = service.getMessages(ticketId, customer);
    expect(result.messages.length).toBe(1);
    expect(result.messages[0].body).toBe('Hello');
    expect(result.cursor).toBe(result.messages[0].id);
    expect(result.hasMore).toBe(false);
  });

  it('customer cannot view messages on another customer ticket', () => {
    const ticketId = createTicket();
    expect(() => service.getMessages(ticketId, otherCustomer)).toThrow(
      'You can only access your own tickets',
    );
  });

  it('agent can view messages on any ticket', () => {
    const ticketId = createTicket();
    service.sendMessage(ticketId, customer, 'Agent visibility test');
    const result = service.getMessages(ticketId, agent);
    expect(result.messages.length).toBe(1);
    expect(result.messages[0].body).toBe('Agent visibility test');
  });

  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.getMessages(999999, customer)).toThrow('Ticket not found');
  });
});

describe('sendMessage', () => {
  it('customer can send a message on their open ticket', () => {
    const ticketId = createTicket();
    const message = service.sendMessage(ticketId, customer, 'Need help');
    expect(message.body).toBe('Need help');
    expect(message.ticketId).toBe(ticketId);
    expect(message.authorId).toBe(customer.id);
    expect(message.createdAt).toBeGreaterThan(0);
    expect(message.status).toBe('sent');
  });

  it('agent can send a message on an open ticket', () => {
    const ticketId = createTicket();
    const message = service.sendMessage(ticketId, agent, 'I can help');
    expect(message.body).toBe('I can help');
  });

  it('agent can send a message on an assigned ticket', () => {
    const ticketId = createTicket();
    assignTicket(ticketId);
    const message = service.sendMessage(ticketId, agent, 'On it');
    expect(message.body).toBe('On it');
  });

  it('customer cannot send message on a resolved ticket', () => {
    const ticketId = createTicket();
    assignTicket(ticketId);
    resolveTicket(ticketId);
    expect(() => service.sendMessage(ticketId, customer, 'Still broken')).toThrow(
      'Cannot send messages on resolved or cancelled tickets',
    );
  });

  it('customer cannot send message on a cancelled ticket', () => {
    const ticketId = createTicket();
    cancelTicket(ticketId);
    expect(() => service.sendMessage(ticketId, customer, 'Wait')).toThrow(
      'Cannot send messages on resolved or cancelled tickets',
    );
  });

  it('customer cannot send on another customer ticket', () => {
    const ticketId = createTicket();
    expect(() => service.sendMessage(ticketId, otherCustomer, 'Hi')).toThrow(
      'You can only access your own tickets',
    );
  });

  it('throws NotFoundError for non-existent ticket', () => {
    expect(() => service.sendMessage(999999, customer, 'Hello')).toThrow('Ticket not found');
  });

  it('marks the other participant messages as read', () => {
    const ticketId = createTicket();
    assignTicket(ticketId);
    const msg1 = service.sendMessage(ticketId, customer, 'Hello');
    const msg2 = service.sendMessage(ticketId, customer, 'World');
    expect(msg1.status).toBe('sent');
    expect(msg2.status).toBe('sent');

    service.markAsRead(ticketId, agent.id);

    const updated = db.select().from(messages).where(eq(messages.id, msg1.id)).all() as any[];
    expect(updated[0].status).toBe('read');
    const updated2 = db.select().from(messages).where(eq(messages.id, msg2.id)).all() as any[];
    expect(updated2[0].status).toBe('read');
  });

  it('links orphan attachments to the sent message', () => {
    const ticketId = createTicket();
    const now = Date.now();

    const attachRows = db
      .insert(attachments)
      .values({
        messageId: null,
        ticketId,
        uploaderId: customer.id,
        fileName: 'test.png',
        fileSize: 100,
        mimeType: 'image/png',
        filePath: 'test.png',
        createdAt: now,
      })
      .returning()
      .all() as { id: number; messageId: number | null }[];

    const attachmentId = attachRows[0].id;
    expect(attachRows[0].messageId).toBeNull();

    // @ts-expect-error - sendMessage now accepts attachmentIds
    const message = service.sendMessage(ticketId, customer, 'With attachment', [attachmentId]);

    const updated = db.select().from(attachments).where(eq(attachments.id, attachmentId)).all() as {
      id: number;
      messageId: number | null;
    }[];

    expect(updated[0].messageId).toBe(message.id);
  });
});

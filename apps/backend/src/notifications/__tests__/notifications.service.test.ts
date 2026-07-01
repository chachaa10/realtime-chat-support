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

import { NotificationsService } from '../notifications.service';

let service: NotificationsService;

const agentId = `agent_${randomUUID().slice(0, 12)}`;
const customerId = `cust_${randomUUID().slice(0, 12)}`;
const otherUserId = `user_${randomUUID().slice(0, 12)}`;

function createTables() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified integer DEFAULT false NOT NULL, image text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS profiles (id text PRIMARY KEY, role text NOT NULL, status text NOT NULL DEFAULT 'online', created_at integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS tickets (id integer PRIMARY KEY AUTOINCREMENT, subject text NOT NULL, description text NOT NULL, status text NOT NULL DEFAULT 'open', customer_id text NOT NULL REFERENCES profiles(id), agent_id text REFERENCES profiles(id), created_at integer NOT NULL, updated_at integer NOT NULL, resolved_at integer, cancelled_at integer)`,
    `CREATE TABLE IF NOT EXISTS ticket_events (id integer PRIMARY KEY AUTOINCREMENT, ticket_id integer NOT NULL REFERENCES tickets(id), from_status text, to_status text NOT NULL, actor_id text NOT NULL REFERENCES profiles(id), reason text, created_at integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notifications (id integer PRIMARY KEY AUTOINCREMENT, user_id text NOT NULL REFERENCES profiles(id), type text NOT NULL, ticket_id integer NOT NULL REFERENCES tickets(id), message text NOT NULL, is_read integer NOT NULL DEFAULT 0, created_at integer NOT NULL)`,
  ];
  for (const s of stmts) db.run(s);
}

beforeAll(async () => {
  createTables();

  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${agentId}, 'agent', ${Date.now()})`,
  );
  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${customerId}, 'customer', ${Date.now()})`,
  );
  db.run(
    sql`INSERT INTO profiles (id, role, created_at) VALUES (${otherUserId}, 'customer', ${Date.now()})`,
  );

  const now = Date.now();
  db.run(
    sql`INSERT INTO tickets (id, subject, description, status, customer_id, agent_id, created_at, updated_at) VALUES (1, 'Test ticket', 'Test', 'open', ${customerId}, NULL, ${now}, ${now})`,
  );
  db.run(
    sql`INSERT INTO tickets (id, subject, description, status, customer_id, agent_id, created_at, updated_at) VALUES (2, 'Assigned ticket', 'Test', 'in_progress', ${customerId}, ${agentId}, ${now}, ${now})`,
  );

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [NotificationsService],
  }).compile();

  service = moduleRef.get(NotificationsService);
});

afterAll(async () => {
  db.run(sql`DELETE FROM notifications`);
  const dbPath = process.env.DATABASE_PATH;
  if (dbPath && dbPath !== ':memory:') {
    try {
      unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  }
});

describe('notifications service', () => {
  it('creates a notification', () => {
    const n = service.create(agentId, 'ticket_assigned', 1, 'Ticket assigned to you');
    expect(n).toMatchObject({
      userId: agentId,
      type: 'ticket_assigned',
      ticketId: 1,
      message: 'Ticket assigned to you',
      isRead: 0,
    });
    expect(n.id).toBeGreaterThan(0);
  });

  it('lists notifications for a user ordered by created_at desc', () => {
    const notifications = service.findAll(agentId);
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < notifications.length; i++) {
      expect(notifications[i].createdAt).toBeLessThanOrEqual(notifications[i - 1].createdAt);
    }
  });

  it('getUnreadCount returns correct count', () => {
    const count = service.getUnreadCount(agentId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('does not list other user notifications', () => {
    const notifications = service.findAll(otherUserId);
    expect(notifications).toHaveLength(0);
  });

  it('marks a notification as read', () => {
    const notifications = service.findAll(agentId);
    const unread = notifications.filter((n) => n.isRead === 0);
    expect(unread.length).toBeGreaterThan(0);

    service.markRead(unread[0].id, agentId);
    const updated = service.findAll(agentId);
    const marked = updated.find((n) => n.id === unread[0].id);
    expect(marked?.isRead).toBe(1);
  });

  it('markAllRead marks all as read', () => {
    service.create(otherUserId, 'ticket_resolved', 1, 'Ticket resolved');
    service.markAllRead(otherUserId);
    const remaining = service.getUnreadCount(otherUserId);
    expect(remaining).toBe(0);
  });

  it('markReadByTicket marks notifications for a ticket as read', () => {
    service.create(otherUserId, 'new_message', 2, 'New message');
    service.markReadByTicket(2, otherUserId);
    const count = service.getUnreadCount(otherUserId);
    expect(count).toBe(0);
  });
});

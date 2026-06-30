import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { eq, sql } from 'drizzle-orm';
import { describe, it, expect } from 'vitest';

import { createClient } from '../client';
import { runMigrations } from '../migrate';
import {
  users, sessions, accounts, verifications,
  profiles, tickets, ticketEvents, labels, ticketLabels,
} from '../schema';

describe('database migrations', () => {
  it('creates all tables', async () => {
    const db = createClient();
    await runMigrations(db);

    const rows = db
      .all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .map((r: any) => r.name);

    expect(rows).toContain('tickets');
    expect(rows).toContain('ticket_events');
    expect(rows).toContain('profiles');
    expect(rows).toContain('labels');
    expect(rows).toContain('ticket_labels');
    expect(rows).toContain('users');
    expect(rows).toContain('sessions');
    expect(rows).toContain('accounts');
    expect(rows).toContain('messages');
    expect(rows).toContain('attachments');
    expect(rows).toContain('verifications');
  });
});

describe('ticket events', () => {
  it('records state transitions', async () => {
    const db = createClient();
    await runMigrations(db);

    db.insert(users)
      .values({
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(profiles).values({ id: 'u1', role: 'customer', createdAt: Date.now() }).run();

    const now = Date.now();
    const [ticket] = db
      .insert(tickets)
      .values({
        subject: 'Help',
        description: 'Need help',
        status: 'open',
        customerId: 'u1',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all();

    db.insert(ticketEvents)
      .values({
        ticketId: ticket.id,
        fromStatus: null,
        toStatus: 'open',
        actorId: 'u1',
        createdAt: now,
      })
      .run();

    const events = db.select().from(ticketEvents).where(eq(ticketEvents.ticketId, ticket.id)).all();

    expect(events).toHaveLength(1);
    expect(events[0].fromStatus).toBeNull();
    expect(events[0].toStatus).toBe('open');
    expect(events[0].actorId).toBe('u1');
  });
});

describe('runMigrations', () => {
  it('handles directory without migration folders', async () => {
    const db = createClient();
    const dir = import.meta.dirname;
    await runMigrations(db, dir);
  });

  it('handles migration folder without migration.sql', async () => {
    const tmpDir = path.join(tmpdir(), `test-migrate-${randomUUID()}`);
    const subDir = path.join(tmpDir, '0001_test');
    fs.mkdirSync(subDir, { recursive: true });
    // no migration.sql in the subfolder
    const db = createClient();
    await runMigrations(db, tmpDir);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('handles empty statements in migration SQL', async () => {
    const tmpDir = path.join(tmpdir(), `test-migrate-${randomUUID()}`);
    const subDir = path.join(tmpDir, '0001_test');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, 'migration.sql'),
      'SELECT 1 as v;\n--> statement-breakpoint\n--> statement-breakpoint\nSELECT 2 as v;',
    );
    const db = createClient();
    await runMigrations(db, tmpDir);
    const rows = db.all('SELECT 2 as v') as { v: number }[];
    expect(rows[0].v).toBe(2);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('auth schema $onUpdate callbacks', () => {
  function runMigrationsForAuth(db: any) {
    db.run(sql`CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
      email_verified integer DEFAULT false NOT NULL, image text,
      created_at integer NOT NULL, updated_at integer NOT NULL
    )`);
    db.run(sql`CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY, expires_at integer NOT NULL,
      token text NOT NULL UNIQUE, created_at integer NOT NULL,
      updated_at integer NOT NULL, ip_address text, user_agent text,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE
    )`);
    db.run(sql`CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token text, refresh_token text, id_token text,
      access_token_expires_at integer, refresh_token_expires_at integer,
      scope text, password text,
      created_at integer NOT NULL, updated_at integer NOT NULL
    )`);
    db.run(sql`CREATE TABLE IF NOT EXISTS verifications (
      id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
      expires_at integer NOT NULL, created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`);
  }

  it('triggers $onUpdate for users', () => {
    const db = createClient();
    runMigrationsForAuth(db);
    const sql = db.update(users).set({ name: 'Test' }).toSQL();
    expect(sql.sql).toContain('updated_at');
  });

  it('triggers $onUpdate for sessions', () => {
    const db = createClient();
    runMigrationsForAuth(db);
    const sql = db.update(sessions).set({ ipAddress: 'x' }).toSQL();
    expect(sql.sql).toContain('updated_at');
  });

  it('triggers $onUpdate for accounts', () => {
    const db = createClient();
    runMigrationsForAuth(db);
    const sql = db.update(accounts).set({ scope: 'user' }).toSQL();
    expect(sql.sql).toContain('updated_at');
  });

  it('triggers $onUpdate for verifications', () => {
    const db = createClient();
    runMigrationsForAuth(db);
    const sql = db.update(verifications).set({ value: 'x' }).toSQL();
    expect(sql.sql).toContain('updated_at');
  });
});

describe('labels', () => {
  it('inserts and queries labels', async () => {
    const db = createClient();
    await runMigrations(db);

    db.insert(users)
      .values({
        id: 'u1',
        name: 'Alice',
        email: 'alice@test.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .run();

    db.insert(profiles).values({ id: 'u1', role: 'customer', createdAt: Date.now() }).run();

    const now = Date.now();
    const [ticket] = db
      .insert(tickets)
      .values({
        subject: 'Help',
        description: 'Need help',
        status: 'open',
        customerId: 'u1',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all();

    const [label] = db.insert(labels).values({ name: 'urgent', color: '#f00' }).returning().all();

    db.insert(ticketLabels).values({ ticketId: ticket.id, labelId: label.id }).run();

    const allLabels = db.select().from(labels).orderBy(labels.name).all();
    expect(allLabels).toHaveLength(1);
    expect(allLabels[0].name).toBe('urgent');

    const tlRows = db.select().from(ticketLabels).where(eq(ticketLabels.ticketId, ticket.id)).all();
    expect(tlRows).toHaveLength(1);
    expect(tlRows[0].labelId).toBe(label.id);
  });

  it('enforces unique label name', async () => {
    const db = createClient();
    await runMigrations(db);

    db.insert(labels).values({ name: 'urgent', color: '#f00' }).run();
    expect(() => db.insert(labels).values({ name: 'urgent', color: '#00f' }).run()).toThrow();
  });
});

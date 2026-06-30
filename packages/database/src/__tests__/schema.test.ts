import { eq } from 'drizzle-orm';
import { describe, it, expect } from 'vitest';

import { createClient } from '../client';
import { runMigrations } from '../migrate';
import { users, profiles, tickets, ticketEvents, labels, ticketLabels } from '../schema';

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

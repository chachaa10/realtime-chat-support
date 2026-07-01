import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { faker } from '@faker-js/faker';
import { initEnv, env } from '@repo/shared/init-env';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import * as schema from './schema';

const projectRoot = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), '..');
initEnv(projectRoot);

const LABELS = [
  { name: 'billing', color: '#3b82f6' },
  { name: 'account', color: '#8b5cf6' },
  { name: 'technical', color: '#ef4444' },
  { name: 'feature-request', color: '#10b981' },
  { name: 'general', color: '#6b7280' },
  { name: 'urgent', color: '#f97316' },
];

const STATIC_USERS = [
  { name: 'Agent', email: 'agent@test.com', password: 'Qwert1234', role: 'agent' as const },
  { name: 'Customer', email: 'customer@test.com', password: 'Qwert1234', role: 'customer' as const },
];

async function seed() {
  const client = new Database(env.DATABASE_PATH);
  const db = drizzle({ client, schema });

  console.log('Seeding database...');

  db.run(sql`DELETE FROM ticket_labels`);
  db.run(sql`DELETE FROM ticket_events`);
  db.run(sql`DELETE FROM messages`);
  db.run(sql`DELETE FROM attachments`);
  db.run(sql`DELETE FROM notifications`);
  db.run(sql`DELETE FROM tickets`);
  db.run(sql`DELETE FROM profiles`);
  db.run(sql`DELETE FROM sessions`);
  db.run(sql`DELETE FROM accounts`);
  db.run(sql`DELETE FROM verifications`);
  db.run(sql`DELETE FROM users`);
  db.run(sql`DELETE FROM labels`);

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'sqlite', schema, camelCase: false, usePlural: true }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: false },
  });

  const agentIds: string[] = [];
  const customerIds: string[] = [];

  for (const u of STATIC_USERS) {
    let registeredUser: { id: string };
    try {
      const result = await auth.api.signUpEmail({
        body: { name: u.name, email: u.email, password: u.password },
      });
      registeredUser = result.user;
    } catch {
      try {
        registeredUser = db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(sql`email = ${u.email}`)
          .get() as { id: string };
      } catch {
        console.error(`  Could not find or create user: ${u.email}`);
        continue;
      }
    }

    if (!registeredUser) {
      console.error(`  Could not find or create user: ${u.email}`);
      continue;
    }

    try {
      db.insert(schema.profiles)
        .values({ id: registeredUser.id, role: u.role, createdAt: Date.now() })
        .run();
    } catch {
      // profile already exists
    }

    if (u.role === 'agent') {
      db.update(schema.profiles)
        .set({ status: 'online' })
        .where(sql`id = ${registeredUser.id}`)
        .run();
      agentIds.push(registeredUser.id);
    } else {
      customerIds.push(registeredUser.id);
    }

    console.log(`  Created user: ${u.email} (${u.role})`);
  }

  if (agentIds.length === 0 || customerIds.length === 0) {
    throw new Error('Failed to create agents or customers');
  }

  const labelRows = db.insert(schema.labels).values(LABELS).returning().all() as {
    id: number;
    name: string;
    color: string;
  }[];

  const now = Date.now();
  const ticketConfigs: { status: 'open' | 'in_progress' | 'resolved' | 'cancelled'; subject: string }[] = [
    { status: 'open', subject: 'Cannot access my account' },
    { status: 'open', subject: 'Feature request: dark mode' },
    { status: 'in_progress', subject: 'Payment not processed' },
    { status: 'in_progress', subject: 'Slow response times' },
    { status: 'resolved', subject: 'Error when uploading file' },
    { status: 'cancelled', subject: 'Refund request' },
  ];
  const ticketValues = ticketConfigs.flatMap((cfg, i) => {
    const customerId = faker.helpers.arrayElement(customerIds);
    const isAssigned = cfg.status === 'in_progress' || cfg.status === 'resolved';
    const agentId = isAssigned ? faker.helpers.arrayElement(agentIds) : null;
    const offset = i * 60000;
    return {
      subject: cfg.subject,
      description: faker.lorem.paragraph(),
      status: cfg.status,
      customerId,
      agentId,
      createdAt: now - offset,
      updatedAt: now - offset,
      resolvedAt: cfg.status === 'resolved' ? now - offset + 30000 : null,
      cancelledAt: cfg.status === 'cancelled' ? now - offset + 30000 : null,
    };
  });

  const ticketRows = db.insert(schema.tickets).values(ticketValues).returning().all() as {
    id: number;
    status: string;
    createdAt: number;
    resolvedAt: number | null;
    cancelledAt: number | null;
  }[];

  for (const t of ticketRows) {
    const customerActor = faker.helpers.arrayElement(customerIds);
    const agentActor = faker.helpers.arrayElement(agentIds);

    db.run(
      sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, NULL, 'open', ${customerActor}, ${t.createdAt})`,
    );

    if (t.status === 'in_progress' || t.status === 'resolved') {
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'open', 'in_progress', ${agentActor}, ${t.createdAt + 10000})`,
      );
    }

    if (t.status === 'resolved') {
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'in_progress', 'resolved', ${agentActor}, ${t.resolvedAt!})`,
      );
    }

    if (t.status === 'cancelled') {
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'open', 'cancelled', ${customerActor}, ${t.cancelledAt!})`,
      );
    }
  }

  for (const ticket of ticketRows) {
    const randomLabels = faker.helpers.arrayElements(
      labelRows,
      faker.number.int({ min: 0, max: 2 }),
    );
    for (const label of randomLabels) {
      try {
        db.insert(schema.ticketLabels).values({ ticketId: ticket.id, labelId: label.id }).run();
      } catch {
        // skip
      }
    }
  }

  console.log(
    `  Inserted ${agentIds.length + customerIds.length} users, ${labelRows.length} labels, ${ticketRows.length} tickets.`,
  );
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

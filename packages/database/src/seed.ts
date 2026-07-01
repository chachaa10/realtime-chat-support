import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { faker } from '@faker-js/faker';
import { initEnv, env } from '@repo/shared/init-env';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';

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

async function seed() {
  const client = new Database(env.DATABASE_PATH);
  const db = drizzle({ client, schema });

  console.log('Seeding database...');

  const agents = faker.helpers.multiple(
    () => {
      const id = faker.string.uuid();
      const now = new Date();
      return {
        id,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        emailVerified: true,
        image: faker.image.avatarGitHub(),
        createdAt: now,
        updatedAt: now,
      };
    },
    { count: 3 },
  );

  const customers = faker.helpers.multiple(
    () => {
      const id = faker.string.uuid();
      const now = new Date();
      return {
        id,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        emailVerified: faker.datatype.boolean(0.7),
        image: faker.image.avatarGitHub(),
        createdAt: now,
        updatedAt: now,
      };
    },
    { count: 5 },
  );

  const agentIds = new Set(agents.map((u) => u.id));
  const customerIds = customers.map((u) => u.id);
  const allUsers = [...agents, ...customers];
  db.insert(schema.users).values(allUsers).run();

  db.insert(schema.profiles)
    .values(
      allUsers.map((u) => ({
        id: u.id,
        role: agentIds.has(u.id) ? ('agent' as const) : ('customer' as const),
        ...(agentIds.has(u.id) ? { status: 'online' as const } : {}),
        createdAt: Date.now(),
      })),
    )
    .run();

  const labelRows = db.insert(schema.labels).values(LABELS).returning().all() as {
    id: number;
    name: string;
    color: string;
  }[];

  const now = Date.now();
  const statuses: ('open' | 'in_progress' | 'resolved' | 'cancelled')[] = [
    'open', 'in_progress', 'resolved', 'cancelled', 'open', 'in_progress', 'open', 'resolved',
  ]
  const ticketValues = customerIds.flatMap((customerId, i) => {
    const count = 1 + (i % 2);
    return Array.from({ length: count }, (_, j) => {
      const idx = (i * count + j) % statuses.length
      const status = statuses[idx]
      const isAssigned = status === 'in_progress' || status === 'resolved'
      const agentId = isAssigned ? faker.helpers.arrayElement([...agentIds]) : null
      const offset = (i * count + j) * 60000
      return {
        subject: faker.helpers.arrayElement([
          'Cannot access my account',
          'Payment not processed',
          'Error when uploading file',
          'Feature request: dark mode',
          'Login page broken',
          'Refund request',
          'Slow response times',
          'Password reset not working',
          'Need help with setup',
          'Billing discrepancy',
        ]),
        description: faker.lorem.paragraph(),
        status,
        customerId,
        agentId,
        createdAt: now - offset,
        updatedAt: now - offset,
        resolvedAt: status === 'resolved' ? now - offset + 30000 : null,
        cancelledAt: status === 'cancelled' ? now - offset + 30000 : null,
      };
    });
  });

  const ticketRows = db.insert(schema.tickets).values(ticketValues).returning().all() as {
    id: number;
    status: string;
    createdAt: number;
    resolvedAt: number | null;
    cancelledAt: number | null;
  }[];

  for (const t of ticketRows) {
    const customerActor = customerIds[0]
    const agentActor = faker.helpers.arrayElement([...agentIds])

    // null → open (ticket created)
    db.run(
      sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, NULL, 'open', ${customerActor}, ${t.createdAt})`,
    )

    if (t.status === 'in_progress' || t.status === 'resolved') {
      // open → in_progress (agent assigned)
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'open', 'in_progress', ${agentActor}, ${t.createdAt + 10000})`,
      )
    }

    if (t.status === 'resolved') {
      // in_progress → resolved (ticket resolved)
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'in_progress', 'resolved', ${agentActor}, ${t.resolvedAt!})`,
      )
    }

    if (t.status === 'cancelled') {
      // open → cancelled (customer cancelled)
      db.run(
        sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, 'open', 'cancelled', ${customerActor}, ${t.cancelledAt!})`,
      )
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
    `Inserted ${allUsers.length} users, ${labelRows.length} labels, ${ticketRows.length} tickets.`,
  );
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

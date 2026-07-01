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
  const ticketValues = customerIds.flatMap((customerId, i) => {
    const count = 1 + (i % 2);
    return Array.from({ length: count }, (_, j) => {
      const isAssigned = j === 0 && i % 2 === 0;
      const status: 'open' | 'in_progress' = isAssigned ? 'in_progress' : 'open';
      const offset = (i * count + j) * 60000;
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
        agentId: isAssigned ? faker.helpers.arrayElement([...agentIds]) : null,
        createdAt: now - offset,
        updatedAt: now - offset,
      };
    });
  });

  const ticketRows = db.insert(schema.tickets).values(ticketValues).returning().all() as {
    id: number;
    status: string;
    createdAt: number;
  }[];

  for (const t of ticketRows) {
    const actorId = t.status === 'open' ? customerIds[0] : [...agentIds][0];
    db.run(
      sql`INSERT INTO ticket_events (ticket_id, from_status, to_status, actor_id, created_at) VALUES (${t.id}, NULL, ${t.status}, ${actorId}, ${t.createdAt})`,
    );
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

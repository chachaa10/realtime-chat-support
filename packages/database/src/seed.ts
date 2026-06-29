import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { faker } from '@faker-js/faker';
import { env } from '@repo/shared';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

const projectRoot = resolve(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), '..');
dotenv.config({ path: resolve(projectRoot, '.env') });

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
  const allUsers = [...agents, ...customers];
  await db.insert(schema.users).values(allUsers);

  await db.insert(schema.profiles).values(
    allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: agentIds.has(u.id) ? ('agent' as const) : ('customer' as const),
      createdAt: Date.now(),
    })),
  );

  console.log(`Inserted ${allUsers.length} users with profiles.`);
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

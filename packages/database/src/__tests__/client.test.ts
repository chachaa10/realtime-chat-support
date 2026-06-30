import { describe, it, expect } from 'vitest';

import { createClient, getDb, closeDb, db } from '../client';
import { runMigrations } from '../migrate';

describe('createClient', () => {
  it('creates an in-memory database by default', () => {
    const client = createClient();
    expect(client).toBeDefined();
    const rows = client.all('SELECT 1 as v') as { v: number }[];
    expect(rows[0].v).toBe(1);
  });

  it('accepts a custom db path', () => {
    const client = createClient(':memory:');
    expect(client).toBeDefined();
  });
});

describe('getDb and closeDb', () => {
  it('getDb returns a database instance', () => {
    const instance = getDb();
    expect(instance).toBeDefined();
    const rows = instance.all('SELECT 1 as v') as { v: number }[];
    expect(rows[0].v).toBe(1);
  });

  it('getDb returns the same instance on subsequent calls', () => {
    const a = getDb();
    const b = getDb();
    expect(a).toBe(b);
  });

  it('closeDb closes the database', () => {
    closeDb();
    // calling getDb after close recreates the connection
    const instance = getDb();
    expect(instance).toBeDefined();
    // clean up for other tests
    closeDb();
  });

  it('closeDb is safe to call multiple times', () => {
    closeDb();
    closeDb();
  });

  it('getDb creates instance usable for queries', async () => {
    closeDb();
    const instance = getDb();
    const { runMigrations } = await import('../migrate');
    await runMigrations(instance);
    const tables = instance.all(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    ) as { name: string }[];
    expect(tables.length).toBeGreaterThan(0);
    closeDb();
  });
});

describe('db proxy', () => {
  it('forwards calls through the proxy', () => {
    const instance = getDb();
    const rows = instance.all('SELECT 1 as v') as { v: number }[];
    expect(rows[0].v).toBe(1);
  });

  it('db proxy works through import', () => {
    const rows = db.all('SELECT 1 as v') as { v: number }[];
    expect(rows[0].v).toBe(1);
  });
});

import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('@repo/shared', () => {
  const dbPath = join(tmpdir(), `test-${randomUUID()}.db`);
  return {
    env: {
      PORT: 3002,
      CORS_ORIGIN: 'http://localhost:5173',
      BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-thirty-two-chars!!',
      BETTER_AUTH_URL: 'http://localhost:3002',
      DATABASE_PATH: dbPath,
    },
  };
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { db } from '@repo/database';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { DatabaseModule } from '../database/database.module';
import { auth } from './auth';

let app: INestApplication;

const createTables = [
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
];

beforeAll(async () => {
  for (const sql of createTables) {
    await db.run(sql);
  }

  const moduleRef = await Test.createTestingModule({
    imports: [
      AuthModule.forRoot({
        auth,
        bodyParser: {
          json: { limit: '1mb' },
          urlencoded: { enabled: true, extended: true },
        },
      }),
      DatabaseModule,
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  app.enableShutdownHooks();
  await app.init();
});

afterAll(async () => {
  await app?.close();
});

describe('POST /api/auth/sign-up/email', () => {
  const user = { name: 'Alice', email: 'alice@test.com', password: 'password123' };

  it('creates user and returns token for valid credentials', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(user);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      token: expect.any(String),
      user: {
        name: 'Alice',
        email: 'alice@test.com',
        emailVerified: false,
      },
    });
  });

  it('rejects duplicate email', async () => {
    const res = await request(app.getHttpServer()).post('/api/auth/sign-up/email').send(user);

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/sign-in/email', () => {
  it('returns token for correct credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      token: expect.any(String),
      user: {
        email: 'alice@test.com',
      },
    });
  });

  it('rejects wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'alice@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

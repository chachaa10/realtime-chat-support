import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('@repo/shared', async (importOriginal) => {
  const dbPath = join(tmpdir(), `test-${randomUUID()}.db`)
  process.env.DATABASE_PATH = dbPath
  const actual = await importOriginal()
  return {
    ...actual,
    env: new Proxy({} as Record<string, unknown>, {
      get(_, prop) {
        if (prop === 'DATABASE_PATH') return dbPath
        if (prop === 'PORT') return 3099
        if (prop === 'CORS_ORIGIN') return 'http://localhost:5173'
        if (prop === 'BETTER_AUTH_SECRET') return 'test-secret-that-is-at-least-thirty-two-chars!!'
        if (prop === 'BETTER_AUTH_URL') return 'http://localhost:3099'
        if (prop === 'UPLOAD_DIR') return join(tmpdir(), `upload-test-${randomUUID()}`)
        return undefined
      },
    }),
  }
})

import { sql } from 'drizzle-orm'
import type { INestApplication } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import { Test } from '@nestjs/testing'
import { db, tickets } from '@repo/database'
import request from 'supertest'

import { AuthService } from '../../auth/auth.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { FILE_STORAGE, type FileStorage } from '../file-storage'
import { LocalFileStorage } from '../local-file-storage'
import { UploadController } from '../upload.controller'

describe('UploadController', () => {
  let app: INestApplication
  let fileStorage: FileStorage
  let uploadDir: string

  const customer = { id: `cust_${randomUUID().slice(0, 12)}`, name: 'Alice', email: 'a@test.com', role: 'customer' as const }
  const agent = { id: `agent_${randomUUID().slice(0, 12)}`, name: 'Bob', email: 'b@test.com', role: 'agent' as const }

  function createTables() {
    const stmts = [
      `CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, email_verified integer DEFAULT false NOT NULL, image text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY, expires_at integer NOT NULL, token text NOT NULL UNIQUE, created_at integer NOT NULL, updated_at integer NOT NULL, ip_address text, user_agent text, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE)`,
      `CREATE TABLE IF NOT EXISTS accounts (id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, access_token text, refresh_token text, id_token text, access_token_expires_at integer, refresh_token_expires_at integer, scope text, password text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS verifications (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expires_at integer NOT NULL, created_at integer NOT NULL, updated_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS profiles (id text PRIMARY KEY, role text NOT NULL, created_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS tickets (id integer PRIMARY KEY AUTOINCREMENT, subject text NOT NULL, description text NOT NULL, status text NOT NULL DEFAULT 'open', customer_id text NOT NULL REFERENCES profiles(id), agent_id text REFERENCES profiles(id), created_at integer NOT NULL, updated_at integer NOT NULL, resolved_at integer, cancelled_at integer)`,
      `CREATE TABLE IF NOT EXISTS messages (id integer PRIMARY KEY AUTOINCREMENT, ticket_id integer NOT NULL REFERENCES tickets(id), author_id text NOT NULL REFERENCES profiles(id), body text NOT NULL, created_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS attachments (id integer PRIMARY KEY AUTOINCREMENT, message_id integer REFERENCES messages(id), ticket_id integer NOT NULL REFERENCES tickets(id), uploader_id text NOT NULL REFERENCES profiles(id), file_name text NOT NULL, file_size integer NOT NULL, mime_type text NOT NULL, file_path text NOT NULL, created_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS ticket_events (id integer PRIMARY KEY AUTOINCREMENT, ticket_id integer NOT NULL REFERENCES tickets(id), from_status text, to_status text NOT NULL, actor_id text NOT NULL REFERENCES profiles(id), reason text, created_at integer NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS labels (id integer PRIMARY KEY AUTOINCREMENT, name text NOT NULL UNIQUE, color text NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS ticket_labels (ticket_id integer NOT NULL REFERENCES tickets(id), label_id integer NOT NULL REFERENCES labels(id), PRIMARY KEY (ticket_id, label_id))`,
    ]
    for (const s of stmts) db.run(s)
  }

  function createTicket(customerId: string) {
    const now = Date.now()
    const rows = db
      .insert(tickets)
      .values({ subject: 'Test', description: 'Help', status: 'open' as const, customerId, createdAt: now, updatedAt: now })
      .returning()
      .all() as { id: number }[]
    return rows[0].id
  }

  beforeAll(async () => {
    createTables()

    uploadDir = mkdtempSync(join(tmpdir(), 'upload-controller-test-'))
    fileStorage = new LocalFileStorage(uploadDir)

    db.run(`INSERT INTO profiles (id, role, created_at) VALUES ('${customer.id}', 'customer', ${Date.now()})`)
    db.run(`INSERT INTO profiles (id, role, created_at) VALUES ('${agent.id}', 'agent', ${Date.now()})`)

    const moduleRef = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        { provide: FILE_STORAGE, useValue: fileStorage },
        { provide: AuthService, useValue: { getSession: vi.fn().mockResolvedValue({ user: { id: customer.id } }) } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: vi.fn((ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<Request>()
          ;(req as any).user = customer
          return true
        }),
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile()

    app = moduleRef.createNestApplication()
    app.useBodyParser('json', { limit: '1mb' })
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
    rmSync(uploadDir, { recursive: true, force: true })
    const dbPath = process.env.DATABASE_PATH
    if (dbPath && dbPath !== ':memory:') {
      try { unlinkSync(dbPath) } catch { /* ignore */ }
    }
  })

  it('POST /uploads rejects request without file', async () => {
    const res = await request(app.getHttpServer()).post('/uploads')
    expect(res.status).toBe(400)
  })

  it('POST /uploads accepts a valid image file and returns attachment', async () => {
    const ticketId = createTicket(customer.id)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
    ])

    const res = await request(app.getHttpServer())
      .post('/uploads')
      .field('ticketId', ticketId.toString())
      .attach('file', pngBuffer, 'screenshot.png')

    if (res.status !== 201) {
      console.error('upload failed:', res.body)
    }
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      ticketId,
      uploaderId: customer.id,
      fileName: 'screenshot.png',
      mimeType: 'image/png',
      messageId: null,
    })
    expect(res.body.data.fileSize).toBe(pngBuffer.length)
    expect(res.body.data.filePath).toBeTruthy()
  })

  it('POST /uploads rejects executable files', async () => {
    const ticketId = createTicket(customer.id)
    const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46]) // ELF magic

    const res = await request(app.getHttpServer())
      .post('/uploads')
      .field('ticketId', ticketId.toString())
      .attach('file', elfBuffer, 'malicious.elf')

    expect(res.status).toBe(400)
  })
})

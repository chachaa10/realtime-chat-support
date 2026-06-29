import { describe, it, expect } from 'vitest';

import { SendMessageSchema, MessageSchema } from '../validations/message';
import { CreateTicketSchema, TicketStatus } from '../validations/ticket';
import { ProfileSchema } from '../validations/profile';
import { LoginSchema, RegisterSchema } from '../validations/auth';

describe('LoginSchema', () => {
  it('accepts valid login', () => {
    expect(
      LoginSchema.safeParse({ email: 'test@example.com', password: 'password123' }).success,
    ).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(LoginSchema.safeParse({ email: 'not-email', password: 'password123' }).success).toBe(
      false,
    );
  });

  it('rejects short password', () => {
    expect(LoginSchema.safeParse({ email: 'test@example.com', password: 'short' }).success).toBe(
      false,
    );
  });
});

describe('RegisterSchema', () => {
  it('accepts valid registration', () => {
    expect(
      RegisterSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: 'Password123',
        role: 'customer',
      }).success,
    ).toBe(true);
  });

  it('rejects missing name', () => {
    expect(
      RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        role: 'customer',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid role', () => {
    expect(
      RegisterSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
      }).success,
    ).toBe(false);
  });
});

describe('ProfileSchema', () => {
  it('accepts valid profile', () => {
    expect(
      ProfileSchema.safeParse({ id: '1', role: 'agent', createdAt: 1000 }).success,
    ).toBe(true);
  });
});

describe('CreateTicketSchema', () => {
  it('accepts valid ticket creation', () => {
    expect(
      CreateTicketSchema.safeParse({ subject: 'Help', description: 'I need help' }).success,
    ).toBe(true);
  });

  it('rejects empty subject', () => {
    expect(CreateTicketSchema.safeParse({ subject: '', description: 'I need help' }).success).toBe(
      false,
    );
  });
});

describe('TicketStatus', () => {
  it('accepts valid statuses', () => {
    expect(TicketStatus.safeParse('open').success).toBe(true);
    expect(TicketStatus.safeParse('in_progress').success).toBe(true);
    expect(TicketStatus.safeParse('resolved').success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(TicketStatus.safeParse('closed').success).toBe(false);
  });
});

describe('SendMessageSchema', () => {
  it('accepts valid message', () => {
    expect(SendMessageSchema.safeParse({ ticketId: 1, body: 'Hello' }).success).toBe(true);
  });

  it('rejects empty body', () => {
    expect(SendMessageSchema.safeParse({ ticketId: 1, body: '' }).success).toBe(false);
  });
});

describe('MessageSchema', () => {
  it('accepts valid message', () => {
    expect(
      MessageSchema.safeParse({
        id: 1,
        ticketId: 1,
        authorId: 'u1',
        body: 'Hello',
        createdAt: 1000,
      }).success,
    ).toBe(true);
  });
});

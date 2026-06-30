import { describe, it, expect } from 'vitest';

import * as errors from '../index';

describe('AppError', () => {
  it('sets name, code, statusCode, and message', () => {
    const err = new errors.AppError('NOT_FOUND', 'custom message', 404);
    expect(err.name).toBe('AppError');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('custom message');
    expect(err.statusCode).toBe(404);
  });

  it('accepts optional errors record', () => {
    const fieldErrors = { email: ['invalid'] };
    const err = new errors.AppError('VALIDATION_ERROR', 'bad', 400, fieldErrors);
    expect(err.errors).toEqual(fieldErrors);
  });
});

describe('NotFoundError', () => {
  it('uses default message', () => {
    const err = new errors.NotFoundError();
    expect(err.message).toBe('Resource not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  it('accepts custom message', () => {
    const err = new errors.NotFoundError('Ticket not found');
    expect(err.message).toBe('Ticket not found');
  });
});

describe('ForbiddenError', () => {
  it('uses default message', () => {
    const err = new errors.ForbiddenError();
    expect(err.message).toBe('Forbidden');
    expect(err.code).toBe('FORBIDDEN');
    expect(err.statusCode).toBe(403);
  });

  it('accepts custom message', () => {
    const err = new errors.ForbiddenError('Access denied');
    expect(err.message).toBe('Access denied');
  });
});

describe('ConflictError', () => {
  it('uses default message', () => {
    const err = new errors.ConflictError();
    expect(err.message).toBe('Conflict');
    expect(err.code).toBe('CONFLICT');
    expect(err.statusCode).toBe(409);
  });

  it('accepts custom message', () => {
    const err = new errors.ConflictError('Already assigned');
    expect(err.message).toBe('Already assigned');
  });
});

describe('ValidationError', () => {
  it('uses default message', () => {
    const err = new errors.ValidationError();
    expect(err.message).toBe('Validation failed');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
  });

  it('accepts custom message and field errors', () => {
    const fieldErrors = { name: ['required'] };
    const err = new errors.ValidationError('Bad input', fieldErrors);
    expect(err.message).toBe('Bad input');
    expect(err.errors).toEqual(fieldErrors);
  });
});

describe('exports', () => {
  it('exports all error classes', () => {
    expect(errors.AppError).toBeTypeOf('function');
    expect(errors.NotFoundError).toBeTypeOf('function');
    expect(errors.ForbiddenError).toBeTypeOf('function');
    expect(errors.ConflictError).toBeTypeOf('function');
    expect(errors.ValidationError).toBeTypeOf('function');
  });
});

import { describe, it, expect, vi } from 'vitest';

import { UserThrottlerGuard } from '../user-throttler.guard';

function createGuard() {
  const options = [{ name: 'test', ttl: 60000, limit: 100 }];
  const storage = { increment: vi.fn().mockResolvedValue({ totalHits: 1 }) };
  return new (UserThrottlerGuard as any)(options, storage, {});
}

describe('UserThrottlerGuard', () => {
  it('tracks authenticated users by ID', async () => {
    const guard = createGuard();
    const req = { user: { id: 'u1' }, ip: '127.0.0.1' };
    const tracker = await guard.getTracker(req);
    expect(tracker).toBe('u1');
  });

  it('falls back to IP for anonymous requests', async () => {
    const guard = createGuard();
    const req = { ip: '10.0.0.1' };
    const tracker = await guard.getTracker(req);
    expect(tracker).toBe('10.0.0.1');
  });

  it('skips auth routes', async () => {
    const guard = createGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/auth/sign-in' }),
      }),
    } as any;
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('enforces throttling on non-auth routes', async () => {
    const guard = createGuard();
    const req = {
      path: '/tickets',
      ip: '10.0.0.1',
      method: 'GET',
      res: { setHeader: vi.fn() },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    // Throws when rate limited
    const storage = (guard as any).storageService;
    storage.increment.mockResolvedValue({
      totalHits: 101,
      timeToExpire: 30000,
      isBlocked: true,
      timeToBlockExpire: 30000,
    });
    await expect(guard.canActivate(context)).rejects.toThrow();
  });
});

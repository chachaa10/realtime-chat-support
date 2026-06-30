import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

@Injectable()
export class UserThrottlerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request.path?.startsWith('/api/auth/')) return true;

    const key = request.user?.id ?? request.ip;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    if (entry.count >= 100) return false;

    entry.count++;
    return true;
  }
}

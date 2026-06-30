import { Injectable, Optional, Inject, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    @Optional() @Inject(Reflector) reflector?: typeof Reflector,
  ) {
    super(options, storageService, reflector ?? new Reflector());
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    return Promise.resolve(req.user?.id ?? req.ip);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.path?.startsWith('/api/auth/')) return true;
    return super.canActivate(context);
  }
}

import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  override getTracker(req: any): string {
    return req.user?.id ?? req.ip;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.path?.startsWith('/api/auth/')) return true;
    return super.canActivate(context);
  }
}

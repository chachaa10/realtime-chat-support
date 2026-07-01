import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  override async getTracker(req: any): Promise<string> {
    return req.user?.id ?? req.ip;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.path?.startsWith('/api/auth/')) return true;
    return super.canActivate(context);
  }

  override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, throttler, blockDuration, getTracker, generateKey } = requestProps;
    const { req, res } = this.getRequestResponse(context);

    const tracker = await getTracker(req, context);
    const key = generateKey(context, tracker, throttler.name!);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        requestProps.ttl,
        limit,
        blockDuration,
        throttler.name!,
      );

    if (isBlocked) {
      res.header('Retry-After', timeToBlockExpire.toString());
      await this.throwThrottlingException(context, {
        limit,
        ttl: requestProps.ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    const remaining = Math.max(0, limit - totalHits);
    const reset = Math.ceil(timeToExpire / 1000);

    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', reset.toString());

    return true;
  }
}

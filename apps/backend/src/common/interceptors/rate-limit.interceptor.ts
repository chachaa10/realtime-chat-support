import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { type Observable } from 'rxjs'

interface RateLimitRecord {
  count: number
  resetAt: number
}

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly hits = new Map<string, RateLimitRecord>()
  private readonly limit = 100
  private readonly ttl = 60000

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest()

    if (request.path?.startsWith('/api/auth/')) {
      return next.handle()
    }

    const key: string = request.user?.id ?? request.ip ?? 'unknown'
    const now = Date.now()
    const record = this.hits.get(key)

    if (record && record.resetAt > now) {
      if (record.count >= this.limit) {
        const timeToBlockExpire = Math.ceil((record.resetAt - now) / 1000)
        const res = context.switchToHttp().getResponse()
        res.header('Retry-After', timeToBlockExpire.toString())
        throw new HttpException(
          { error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      record.count++
    } else {
      this.hits.set(key, { count: 1, resetAt: now + this.ttl })
    }

    const res = context.switchToHttp().getResponse()
    const currentRecord = this.hits.get(key)!
    const remaining = Math.max(0, this.limit - currentRecord.count)
    const reset = Math.ceil((currentRecord.resetAt - now) / 1000)
    res.setHeader('X-RateLimit-Remaining', remaining.toString())
    res.setHeader('X-RateLimit-Reset', reset.toString())

    return next.handle()
  }
}

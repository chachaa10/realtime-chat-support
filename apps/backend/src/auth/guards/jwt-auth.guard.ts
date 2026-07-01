import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { db, profiles } from '@repo/database';
import { fromNodeHeaders } from 'better-auth/node';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';

import { auth } from '../auth';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = new Headers(fromNodeHeaders(request.headers));
    const session = await auth.api.getSession({ headers });

    if (!session?.user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Unauthorized' });

    const profileRows = db
      .select()
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1)
      .all() as { id: string; role: string; createdAt: number }[];

    const user: AuthenticatedUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (profileRows[0]?.role as 'customer' | 'agent') ?? 'customer',
    };

    (request as any).user = user;
    return true;
  }
}

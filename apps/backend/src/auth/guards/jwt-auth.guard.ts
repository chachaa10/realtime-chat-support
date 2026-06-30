import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { db, profiles } from '@repo/database';
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
    const token = this.extractToken(request);
    if (!token) return false;

    const session = await auth.api.getSession({
      headers: { authorization: `Bearer ${token}` },
    });
    if (!session?.user) return false;

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

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice(7);
  }
}

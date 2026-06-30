import { Injectable, Inject, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { db, profiles } from '@repo/database';
import { fromNodeHeaders } from 'better-auth/node';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';

import { AuthService } from '../auth.service';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.authService.getSession(fromNodeHeaders(request.headers));

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
}

import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { ROLES_KEY } from '../../common/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata(ROLES_KEY, context.getHandler()) as
      | string[]
      | undefined;
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as { role: string } | undefined;
    return user != null && requiredRoles.includes(user.role);
  }
}

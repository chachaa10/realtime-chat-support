import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { db, profiles } from '@repo/database';
import { eq } from 'drizzle-orm';

import { ValidationError } from '../common/errors';
import { Roles } from '../common/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'agent')
  async profile(@CurrentUser() user: AuthenticatedUser) {
    const profileRows = db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .all() as { id: string; role: string; createdAt: number }[];

    const profile = profileRows[0];
    if (!profile) {
      return { data: { id: user.id, name: user.name, email: user.email, role: 'customer' } };
    }

    return { data: { id: user.id, name: user.name, email: user.email, role: profile.role } };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer', 'agent')
  async updateProfile(@Body() body: { role: string }, @CurrentUser() user: AuthenticatedUser) {
    const { role } = body;

    if (role !== 'customer' && role !== 'agent') {
      throw new ValidationError('Role must be customer or agent');
    }

    const existing = db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1).all() as {
      id: string;
      role: string;
      createdAt: number;
    }[];

    if (existing.length > 0) {
      db.update(profiles).set({ role }).where(eq(profiles.id, user.id)).run();
    } else {
      db.insert(profiles)
        .values({
          id: user.id,
          role,
          createdAt: Date.now(),
        })
        .run();
    }

    return { data: { id: user.id, name: user.name, email: user.email, role } };
  }

  @Patch('profile/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent')
  async updateAvailability(
    @Body() body: { status: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { status } = body;

    if (status !== 'online' && status !== 'away') {
      throw new ValidationError('Status must be online or away');
    }

    db.update(profiles).set({ status }).where(eq(profiles.id, user.id)).run();

    return { data: { status } };
  }
}

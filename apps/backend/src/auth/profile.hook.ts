import { Injectable } from '@nestjs/common';
import { db, profiles } from '@repo/database';
import { DatabaseHook, AfterCreate } from '@thallesp/nestjs-better-auth';

@DatabaseHook()
@Injectable()
export class ProfileHook {
  @AfterCreate('user')
  async createProfile(user: { id: string; name: string }) {
    await db.insert(profiles).values({
      id: user.id,
      role: 'customer',
      createdAt: Date.now(),
    });
  }
}

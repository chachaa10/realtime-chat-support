import { Injectable, Inject } from '@nestjs/common';
import { profiles } from '@repo/database';
import { type DbClient } from '@repo/database';
import { DatabaseHook, AfterCreate } from '@thallesp/nestjs-better-auth';

import { DB_PROVIDER } from '../database/database.module';

@DatabaseHook()
@Injectable()
export class ProfileHook {
  constructor(@Inject(DB_PROVIDER) private db: DbClient) {}

  @AfterCreate('user')
  async createProfile(user: { id: string; name: string }) {
    await this.db.insert(profiles).values({
      id: user.id,
      role: 'customer',
      createdAt: Date.now(),
    });
  }
}

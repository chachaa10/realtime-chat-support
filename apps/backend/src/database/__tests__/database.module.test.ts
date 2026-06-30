import { Test } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';

import { DatabaseModule, DB_PROVIDER } from '../database.module';

describe('DatabaseModule', () => {
  it('provides DB_PROVIDER', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    const dbProvider = moduleRef.get(DB_PROVIDER);
    expect(dbProvider).toBeDefined();
    await moduleRef.close();
  });
});

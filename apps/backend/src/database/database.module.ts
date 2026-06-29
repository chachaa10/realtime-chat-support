import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { createClient } from '@repo/database';

export const DB_PROVIDER = 'DB_PROVIDER';

@Global()
@Module({
  providers: [
    {
      provide: DB_PROVIDER,
      useFactory: () => {
        const url = process.env.DATABASE_PATH ?? ':memory:';
        return createClient(url);
      },
    },
  ],
  exports: [DB_PROVIDER],
})
export class DatabaseModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    // Close handled in main.ts
  }
}

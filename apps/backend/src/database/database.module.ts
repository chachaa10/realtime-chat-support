import { Global, Module, type OnApplicationShutdown } from '@nestjs/common';
import { db, client, type DbClient } from '@repo/database';

export type { DbClient };

export const DB_PROVIDER = 'DB_PROVIDER';

@Global()
@Module({
  providers: [
    {
      provide: DB_PROVIDER,
      useFactory: () => db,
    },
  ],
  exports: [DB_PROVIDER],
})
export class DatabaseModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    client?.close();
  }
}

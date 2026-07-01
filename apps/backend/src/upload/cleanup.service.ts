import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db, attachments } from '@repo/database';
import { lt, and, isNull } from 'drizzle-orm';

import { FILE_STORAGE, type FileStorage } from './file-storage';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(@Inject(FILE_STORAGE) private readonly fileStorage: FileStorage) {}

  @Cron(CronExpression.EVERY_HOUR)
  cleanupOrphanAttachments() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    const orphans = db
      .select({ id: attachments.id, filePath: attachments.filePath })
      .from(attachments)
      .where(and(isNull(attachments.messageId), lt(attachments.createdAt, oneHourAgo)))
      .all() as { id: number; filePath: string }[];

    for (const orphan of orphans) {
      this.fileStorage.delete(orphan.filePath);
    }

    if (orphans.length > 0) {
      db.delete(attachments)
        .where(and(isNull(attachments.messageId), lt(attachments.createdAt, oneHourAgo)))
        .run();
      this.logger.log(`Cleaned up ${orphans.length} orphan attachments`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanupOldAttachments() {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const old = db
      .select({ id: attachments.id, filePath: attachments.filePath })
      .from(attachments)
      .where(lt(attachments.createdAt, thirtyDaysAgo))
      .all() as { id: number; filePath: string }[];

    for (const attachment of old) {
      this.fileStorage.delete(attachment.filePath);
    }

    if (old.length > 0) {
      db.delete(attachments).where(lt(attachments.createdAt, thirtyDaysAgo)).run();
      this.logger.log(`Cleaned up ${old.length} attachments older than 30 days`);
    }
  }
}

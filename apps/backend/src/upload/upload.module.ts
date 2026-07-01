import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { Module } from '@nestjs/common';

import { CleanupService } from './cleanup.service';
import { FILE_STORAGE } from './file-storage';
import { LocalFileStorage } from './local-file-storage';
import { UploadController } from './upload.controller';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Module({
  controllers: [UploadController],
  providers: [
    {
      provide: FILE_STORAGE,
      useFactory: () => new LocalFileStorage(uploadDir),
    },
    CleanupService,
  ],
  exports: [FILE_STORAGE],
})
export class UploadModule {}

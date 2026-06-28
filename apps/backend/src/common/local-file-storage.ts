import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type { FileStorage, FileRef } from './file-storage';

export class LocalFileStorage implements FileStorage {
  constructor(private basePath: string) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  async save(filename: string, stream: Readable): Promise<FileRef> {
    const id = crypto.randomUUID();
    const ext = path.extname(filename);
    const storedName = `${id}${ext}`;
    const filePath = path.join(this.basePath, storedName);
    const writeStream = fs.createWriteStream(filePath);

    await pipeline(stream, writeStream);

    const stat = fs.statSync(filePath);

    return {
      filePath,
      fileName: filename,
      fileSize: stat.size,
      mimeType: 'application/octet-stream',
    };
  }

  async read(filePath: string): Promise<Readable> {
    return fs.createReadStream(filePath);
  }

  async delete(filePath: string): Promise<void> {
    fs.unlinkSync(filePath);
  }
}

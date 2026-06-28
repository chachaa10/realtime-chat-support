import type { Readable } from 'node:stream';

export interface FileRef {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface FileStorage {
  save(filename: string, stream: Readable): Promise<FileRef>;
  read(filePath: string): Promise<Readable>;
  delete(filePath: string): Promise<void>;
}

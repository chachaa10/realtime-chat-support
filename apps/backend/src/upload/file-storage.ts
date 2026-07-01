export interface FileStorage {
  save(fileName: string, buffer: Buffer): string;
  get(filePath: string): Buffer | null;
  delete(filePath: string): void;
}

export const FILE_STORAGE = 'FILE_STORAGE';

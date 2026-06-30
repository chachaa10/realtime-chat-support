import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

import type { FileStorage } from './file-storage'

export class LocalFileStorage implements FileStorage {
  constructor(private readonly baseDir: string) {
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true })
    }
  }

  save(fileName: string, buffer: Buffer): string {
    const ext = extname(fileName)
    const uniqueName = `${randomUUID()}${ext}`
    const fullPath = join(this.baseDir, uniqueName)
    writeFileSync(fullPath, buffer)
    return uniqueName
  }

  get(filePath: string): Buffer | null {
    const fullPath = join(this.baseDir, filePath)
    try {
      return readFileSync(fullPath)
    } catch {
      return null
    }
  }

  delete(filePath: string): void {
    const fullPath = join(this.baseDir, filePath)
    try {
      unlinkSync(fullPath)
    } catch {
      // file doesn't exist — noop
    }
  }
}

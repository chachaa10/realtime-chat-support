import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { LocalFileStorage } from '../local-file-storage'

describe('LocalFileStorage', () => {
  let storage: LocalFileStorage
  let uploadDir: string

  beforeEach(() => {
    uploadDir = mkdtempSync(join(tmpdir(), 'upload-test-'))
    storage = new LocalFileStorage(uploadDir)
  })

  afterEach(() => {
    rmSync(uploadDir, { recursive: true, force: true })
  })

  it('saves a file and returns its path', () => {
    const filePath = storage.save('test.txt', Buffer.from('hello world'))
    expect(filePath).toMatch(/^[a-f0-9-]+\.txt$/)
    const fullPath = join(uploadDir, filePath)
    expect(existsSync(fullPath)).toBe(true)
    expect(readFileSync(fullPath, 'utf-8')).toBe('hello world')
  })

  it('returns the saved file content', () => {
    const filePath = storage.save('test.txt', Buffer.from('file content'))
    const result = storage.get(filePath)
    expect(result).toBeInstanceOf(Buffer)
    expect(result!.toString()).toBe('file content')
  })

  it('returns null for a non-existent file', () => {
    const result = storage.get('does-not-exist.txt')
    expect(result).toBeNull()
  })

  it('deletes a file that exists', () => {
    const filePath = storage.save('deleteme.txt', Buffer.from('delete me'))
    expect(existsSync(join(uploadDir, filePath))).toBe(true)
    storage.delete(filePath)
    expect(existsSync(join(uploadDir, filePath))).toBe(false)
  })

  it('does not throw when deleting a non-existent file', () => {
    expect(() => storage.delete('ghost.txt')).not.toThrow()
  })

  it('creates the upload directory if it does not exist', () => {
    const newDir = join(tmpdir(), `fresh-upload-${Date.now()}`)
    const s = new LocalFileStorage(newDir)
    s.save('new.txt', Buffer.from('new'))
    expect(existsSync(newDir)).toBe(true)
    rmSync(newDir, { recursive: true, force: true })
  })
})

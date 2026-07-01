// allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
])

// checks magic bytes against known signatures
const MAGIC_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: 'image/svg+xml', bytes: [0x3c, 0x73, 0x76, 0x67] }, // <svg
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'video/mp4', bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp box
  { mime: 'video/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML header
  { mime: 'application/zip', bytes: [0x50, 0x4b, 0x03, 0x04] }, // shared by docx, xlsx, etc.
]

export function detectMimeType(buffer: Buffer, multerMime?: string): string | null {
  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset ?? 0
    if (buffer.length < offset + sig.bytes.length) continue
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b)
    if (match) {
      // For RIFF-based formats (webp), verify it's actually webp
      if (sig.mime === 'image/webp') {
        const webpId = buffer.toString('ascii', 8, 12)
        if (webpId === 'WEBP') return 'image/webp'
        continue
      }
      // For ZIP-based formats, defer to multer's MIME for subtype (docx vs xlsx)
      if (sig.mime === 'application/zip' && multerMime && isAllowedMimeType(multerMime)) {
        return multerMime
      }
      return sig.mime
    }
  }
  // Fallback: accept multer's MIME if it's in the allowed list
  // This handles text/plain, text/csv, and other formats without unique magic signatures
  if (multerMime && isAllowedMimeType(multerMime)) {
    return multerMime
  }
  return null
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType)
}

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

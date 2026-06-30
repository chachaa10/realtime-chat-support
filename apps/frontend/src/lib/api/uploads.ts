import type { Attachment } from '@repo/shared'

const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001'

export function uploadFile(file: File, ticketId: number): Promise<Attachment> {
  return uploadFileWithProgress(file, ticketId, () => {})
}

export function uploadFileWithProgress(
  file: File,
  ticketId: number,
  onProgress: (pct: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = JSON.parse(xhr.responseText)
        resolve(body.data as Attachment)
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          reject(new Error(body.error?.message ?? 'Upload failed'))
        } catch {
          reject(new Error('Upload failed'))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('ticketId', ticketId.toString())

    xhr.open('POST', `${API_BASE}/uploads`)
    xhr.withCredentials = true
    xhr.send(fd)
  })
}

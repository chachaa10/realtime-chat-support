import { useEffect, useState, useRef, useCallback } from 'react'

import type { MessageWithAttachments } from '@/lib/api/messages'
import { fetchAttachmentAsBlob } from '@/lib/api/uploads'

const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001'

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

function isVideo(mimeType: string) {
  return mimeType.startsWith('video/')
}

function AttachmentPreview({ attachmentId, fileName, mimeType }: { attachmentId: number; fileName: string; mimeType: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const revokeRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAttachmentAsBlob(attachmentId).then((blob) => {
      if (cancelled) return
      const objectUrl = URL.createObjectURL(blob)
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current)
      revokeRef.current = objectUrl
      setUrl(objectUrl)
    }).catch(() => {
      if (!cancelled) setError(true)
    })
    return () => {
      cancelled = true
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current)
    }
  }, [attachmentId])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (error) {
    return (
      <a href={`${API_BASE}/uploads/${attachmentId}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.75rem] bg-ink/5 text-ink hover:bg-ink/10 transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
        <span className="truncate">{fileName}</span>
      </a>
    )
  }

  if (!url) {
    return <div className="h-24 w-48 animate-pulse rounded-lg bg-ink/10" />
  }

  const video = isVideo(mimeType)

  return (
    <>
      <button onClick={() => setOpen(true)} className="group relative block cursor-pointer p-0 border-0 bg-transparent">
        {video ? (
          <>
            <video src={url} className="max-h-48 max-w-full rounded-lg object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 group-hover:bg-black/60 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                  <polygon points="8 5 19 12 8 19 8 5" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <img
            src={url}
            alt={fileName}
            className="max-h-48 max-w-full rounded-lg object-cover"
            loading="lazy"
          />
        )}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={close}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {video ? (
              <video
                src={url}
                className="max-h-[90vh] max-w-[90vw] rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                src={url}
                alt={fileName}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              />
            )}
            <button
              onClick={close}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-ink transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'sending') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin text-ink-dim">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    )
  }

  if (status === 'error') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-danger">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  }

  if (status === 'read') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <polyline points="5 12 8 15 10 12" stroke="white" />
        <polyline points="9 12 12 15 18 9" stroke="white" />
      </svg>
    )
  }

  if (status === 'delivered') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-dim">
        <circle cx="12" cy="12" r="10" />
        <polyline points="5 12 8 15 10 12" />
        <polyline points="9 12 12 15 18 9" />
      </svg>
    )
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-dim">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  )
}

interface MessageBubbleProps {
  message: MessageWithAttachments
  isOwn: boolean
  authorName: string
}

export function MessageBubble({ message, isOwn, authorName }: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
          isOwn
            ? 'bg-brand text-primary-foreground'
            : 'bg-surface-raised border-border border'
        }`}
      >
        {!isOwn && (
          <span className="text-ink-dim mb-1 block text-[0.6875rem] font-medium">
            {authorName}
          </span>
        )}
        <p className="text-[0.8125rem] leading-relaxed whitespace-pre-wrap break-words">
          {message.body}
        </p>
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.attachments.map((att) =>
              isImage(att.mimeType) || isVideo(att.mimeType) ? (
                <AttachmentPreview key={att.id} attachmentId={att.id} fileName={att.fileName} mimeType={att.mimeType} />
              ) : (
                <a
                  key={att.id}
                  href={`${API_BASE}/uploads/${att.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[0.75rem] transition-colors ${
                    isOwn
                      ? 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                      : 'bg-ink/5 text-ink hover:bg-ink/10'
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span className="truncate">{att.fileName}</span>
                </a>
              ),
            )}
          </div>
        )}
      </div>
      <span className="text-ink-dim mt-0.5 flex items-center gap-1 px-1 text-[0.625rem]">
        {formatTime(message.createdAt)}
        {isOwn && <StatusIcon status={message.status ?? 'sent'} />}
      </span>
    </div>
  )
}

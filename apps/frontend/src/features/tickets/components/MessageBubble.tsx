import type { MessageWithAttachments } from '@/lib/api/messages'

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
              isImage(att.mimeType) ? (
                <img
                  key={att.id}
                  src={`${API_BASE}/uploads/${att.id}`}
                  alt={att.fileName}
                  className="max-h-48 max-w-full rounded-lg object-cover"
                  loading="lazy"
                />
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
      <span className="text-ink-dim mt-0.5 px-1 text-[0.625rem]">
        {formatTime(message.createdAt)}
      </span>
    </div>
  )
}

import type { Message } from '@repo/shared'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  authorName: string
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, isOwn, authorName }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] space-y-0.5 rounded-xl px-4 py-2.5 ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-surface-raised border-border rounded-bl-sm border'
        }`}
      >
        {!isOwn && (
          <p className="text-ink-muted text-[0.6875rem] font-medium">{authorName}</p>
        )}
        <p className="text-[0.875rem] leading-relaxed whitespace-pre-wrap">{message.body}</p>
        <p
          className={`text-right text-[0.6875rem] ${
            isOwn ? 'text-primary-foreground/60' : 'text-ink-muted'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

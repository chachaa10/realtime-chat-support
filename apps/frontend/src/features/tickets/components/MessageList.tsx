import { useRef, useEffect } from 'react'

import { SkeletonMessage, EmptyState, ErrorState } from '@/components/ui'
import { useAuth } from '@/features/auth/context'
import type { MessageWithAttachments } from '@/lib/api/messages'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: MessageWithAttachments[] | undefined
  isLoading: boolean
  isError?: boolean
  typingIndicator?: string | null
  onRetry?: () => void
}

export function MessageList({ messages, isLoading, isError, typingIndicator, onRetry }: MessageListProps) {
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
          <SkeletonMessage />
          <SkeletonMessage align="end" />
          <SkeletonMessage />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load messages"
        onRetry={onRetry}
      />
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Send the first message!"
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-6 py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.authorId === user?.id}
            authorName={message.authorId === user?.id ? 'You' : message.authorName}
          />
        ))}
        {typingIndicator && (
          <div className="flex justify-start">
            <div className="text-ink-muted rounded-xl bg-ink/5 px-4 py-2 text-[0.8125rem] italic">
              {typingIndicator}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

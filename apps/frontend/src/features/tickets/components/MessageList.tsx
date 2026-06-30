import { useRef, useEffect } from 'react'

import { useAuth } from '@/features/auth/context'
import type { MessageWithAttachments } from '@/lib/api/messages'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: MessageWithAttachments[] | undefined
  isLoading: boolean
  isError?: boolean
  typingIndicator?: string | null
}

export function MessageList({ messages, isLoading, isError, typingIndicator }: MessageListProps) {
  const { user } = useAuth()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className="bg-ink-muted/10 h-12 w-48 animate-pulse rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-danger text-center text-[0.875rem]">
          Failed to load messages
        </p>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-ink-muted text-center text-[0.875rem]">
          No messages yet. Send the first message!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.authorId === user?.id}
          authorName={message.authorId === user?.id ? 'You' : message.authorId}
        />
      ))}
      {typingIndicator && (
        <div className="flex justify-start">
          <div className="text-ink-muted rounded-xl bg-muted/50 px-4 py-2 text-[0.8125rem] italic">
            {typingIndicator}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

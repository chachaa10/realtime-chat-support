import { useState, useRef, useCallback, useEffect } from 'react'

import { getSocket } from '@/lib/socket'
import { useSendMessage } from '../hooks/useSendMessage'

interface MessageInputProps {
  ticketId: number
  disabled?: boolean
  disabledReason?: string
}

export function MessageInput({ ticketId, disabled, disabledReason }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const sendMutation = useSendMessage(ticketId)

  const emitTypingStart = useCallback(() => {
    const socket = getSocket()
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing:start', { ticketId })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit('typing:stop', { ticketId })
    }, 3000)
  }, [ticketId])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (isTypingRef.current) {
        getSocket().emit('typing:stop', { ticketId })
      }
    }
  }, [ticketId])

  function handleChange(value: string) {
    setInput(value)
    if (value.trim()) {
      emitTypingStart()
    }
  }

  function handleSend() {
    const body = input.trim()
    if (!body || disabled) return

    sendMutation.mutate(body, {
      onSuccess: () => {
        setInput('')
        isTypingRef.current = false
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        getSocket().emit('typing:stop', { ticketId })
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      },
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function autoResize() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  const isDisabled = disabled || sendMutation.isPending

  return (
    <div className="border-border flex items-end gap-2 border-t p-4">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            handleChange(e.target.value)
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? (disabledReason ?? '') : 'Type a message...'}
          rows={1}
          disabled={isDisabled}
          className="border-border bg-surface placeholder:text-ink-muted text-ink w-full resize-none rounded-xl border px-4 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-blue-500 disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '160px' }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={isDisabled || !input.trim()}
        className="bg-primary text-primary-foreground hover:bg-primary/80 mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
        aria-label="Send message"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}

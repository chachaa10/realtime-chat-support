import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { Spinner } from '@/components/ui'
import { getSocket } from '@/lib/socket'
import { uploadFileWithProgress } from '@/lib/api/uploads'
import { useSendMessage } from '../hooks/useSendMessage'

interface MessageInputProps {
  ticketId: number
  disabled?: boolean
  disabledReason?: string
}

export function MessageInput({ ticketId, disabled, disabledReason }: MessageInputProps) {
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleSend() {
    const body = input.trim()
    if (!body || disabled || uploading) return

    sendMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setInput('')
          isTypingRef.current = false
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          getSocket().emit('typing:stop', { ticketId })
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
          }
        },
      },
    )
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10MB')
      return
    }

    await handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      const attachment = await uploadFileWithProgress(file, ticketId, (pct) => {
        setUploadProgress(pct)
      })
      const body = input.trim()
      if (body) {
        sendMutation.mutate({ body, attachmentIds: [attachment.id] })
        setInput('')
      } else {
        sendMutation.mutate({ body: '', attachmentIds: [attachment.id] })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const isDisabled = disabled || sendMutation.isPending || uploading
  const canSend = input.trim().length > 0 && !isDisabled

  return (
    <div className="border-border bg-surface border-t px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
        onChange={handleFileSelect}
      />
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="text-ink-dim hover:text-ink mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
          aria-label="Attach file"
        >
          {uploading ? (
            <Spinner size="sm" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </button>
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              handleChange(e.target.value)
              autoResize()
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? (disabledReason ?? '') : 'Send a message...'}
            rows={1}
            disabled={isDisabled}
            className="border-border bg-surface-raised text-ink placeholder:text-ink-dim w-full resize-none rounded-xl border px-4 py-2.5 pr-12 text-[0.875rem] outline-none transition-shadow focus:shadow-[0_0_0_2px_var(--color-brand)] disabled:opacity-50"
            style={{ minHeight: '42px', maxHeight: '160px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
            canSend
              ? 'bg-brand text-primary-foreground hover:bg-brand-hover'
              : 'bg-ink/5 text-ink-dim'
          }`}
          aria-label="Send message"
        >
          {sendMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
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
          )}
        </button>
      </div>
      {uploading && uploadProgress > 0 && (
        <div className="mx-auto mt-2 max-w-3xl">
          <div className="h-1 w-full rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-200 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

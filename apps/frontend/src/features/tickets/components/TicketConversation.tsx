import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/features/auth/context'
import type { TicketData } from '@/lib/api/tickets'
import { sendMessage } from '@/lib/api/messages'
import { uploadFileWithProgress } from '@/lib/api/uploads'

import { useAcceptTicket, useResolveTicket, useCancelTicket, useReturnToQueue } from '../hooks/useTicketMutations'
import { useMessages } from '../hooks/useMessages'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { useAgentCapacity } from '../hooks/useAgentCapacity'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ConnectionStatus } from './ConnectionStatus'
import { TicketTimeline } from './TicketTimeline'
import { TicketActionsPopover } from './TicketActionsPopover'

function formatDate(ts: number) {
  return new Date(ts).toLocaleString()
}

interface TicketConversationProps {
  ticket: TicketData
}

export function TicketConversation({ ticket }: TicketConversationProps) {
  const { user } = useAuth()
  const acceptMutation = useAcceptTicket()
  const resolveMutation = useResolveTicket()
  const cancelMutation = useCancelTicket()
  const returnMutation = useReturnToQueue()

  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setDragOver(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    dragCounter.current = 0

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10MB')
      return
    }

    uploadDroppedFile(file)
  }

  async function uploadDroppedFile(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      const attachment = await uploadFileWithProgress(file, ticket.id, (pct) => {
        setUploadProgress(pct)
      })
      await sendMessage(ticket.id, '', [attachment.id])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const isCustomer = user?.role === 'customer'
  const isAgent = user?.role === 'agent'

  const { data: messages, isLoading: messagesLoading, isError: messagesError, refetch: refetchMessages } = useMessages(ticket.id)
  const typingIndicator = useTypingIndicator(ticket.id)
  const { data: capacity } = useAgentCapacity(isAgent)
  const isOwnTicket = isCustomer && ticket.customerId === user?.id
  const isAssignedAgent = isAgent && ticket.agentId === user?.id

  const isAway = user?.status === 'away'
  const atCapacity = capacity?.atCapacity ?? false
  const canAccept = isAgent && ticket.status === 'open'
  const canResolve = isAssignedAgent && ticket.status === 'in_progress'
  const canCancel = isOwnTicket && ticket.status === 'open'
  const canReturn = isAssignedAgent && ticket.status === 'in_progress'

  const isResolvedOrCancelled = ticket.status === 'resolved' || ticket.status === 'cancelled'
  const inputDisabled = isCustomer && isResolvedOrCancelled

  return (
    <div
      className="relative flex h-full flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {uploading && uploadProgress > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 h-1">
          <div className="h-full rounded-full bg-brand transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-brand/10">
          <div className="flex flex-col items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-brand text-base font-medium">Drop file to attach</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
              ticket.status === 'open'
                ? 'bg-warning'
                : ticket.status === 'in_progress'
                  ? 'bg-accent'
                  : ticket.status === 'resolved'
                    ? 'bg-success'
                    : 'bg-ink-dim'
            }`}
          />
          <div className="min-w-0">
            <h1 className="text-ink truncate text-[0.9375rem] font-semibold">{ticket.subject}</h1>
            <p className="text-ink-muted truncate text-[0.75rem]">
              {ticket.status === 'open' && `Open · Created ${formatDate(ticket.createdAt)}`}
              {ticket.status === 'in_progress' && `In progress · Created ${formatDate(ticket.createdAt)}`}
              {ticket.status === 'resolved' && `Resolved · ${formatDate(ticket.resolvedAt!)}`}
              {ticket.status === 'cancelled' && `Cancelled · ${formatDate(ticket.cancelledAt!)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConnectionStatus />
          {canAccept && (
            <button
              onClick={() => acceptMutation.mutate(ticket.id)}
              disabled={acceptMutation.isPending || isAway || atCapacity}
              title={isAway ? 'You are away' : atCapacity ? 'At capacity' : undefined}
              className="bg-brand text-primary-foreground hover:bg-brand-hover inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[0.8125rem] font-medium transition-colors disabled:opacity-50"
            >
              {acceptMutation.isPending
                ? 'Accepting...'
                : isAway
                  ? 'You are away'
                  : atCapacity
                    ? 'At capacity'
                    : 'Accept'}
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => resolveMutation.mutate(ticket.id)}
              disabled={resolveMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success px-3 text-[0.8125rem] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
            </button>
          )}
          {canReturn && (
            <TicketActionsPopover
              ticketId={ticket.id}
              disabled={returnMutation.isPending}
              isPending={returnMutation.isPending}
              onReturn={() => returnMutation.mutate(ticket.id)}
            />
          )}
          {canCancel && (
            <button
              onClick={() => cancelMutation.mutate(ticket.id)}
              disabled={cancelMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-danger px-3 text-[0.8125rem] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      <div className="border-border flex items-start gap-4 border-b px-6 py-3">
        <div className="bg-brand/10 text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-ink text-[0.8125rem] leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
          {ticket.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ticket.labels.map((l) => (
                <span
                  key={l.id}
                  className="inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"
                  style={{ backgroundColor: l.color + '18', color: l.color }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {ticket.agent && !ticket.agentId && (
        <div className="text-ink-muted border-border border-b px-6 py-2 text-[0.75rem]">
          Agent assigned to this ticket
        </div>
      )}

      <TicketTimeline ticketId={ticket.id} role={isAgent ? 'agent' : 'customer'} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={messagesLoading}
          isError={messagesError}
          onRetry={() => refetchMessages()}
          typingIndicator={typingIndicator}
        />
      </div>

      <MessageInput
        ticketId={ticket.id}
        disabled={inputDisabled}
        disabledReason={isResolvedOrCancelled ? 'This ticket is closed' : undefined}
      />
    </div>
  )
}

import { useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { MessageWithAttachments } from '@/lib/api/messages'

import { fetchMessages } from '@/lib/api/messages'
import { connectSocket } from '@/lib/socket'

export function useMessages(ticketId: number) {
  const queryClient = useQueryClient()

  const query = useQuery<MessageWithAttachments[]>({
    queryKey: ['messages', ticketId],
    queryFn: () => fetchMessages(ticketId),
    enabled: !!ticketId,
  })

  useEffect(() => {
    if (query.isError && query.error) {
      toast.error(query.error instanceof Error ? query.error.message : 'Failed to load messages')
    }
  }, [query.isError, query.error])

  const handleMessageSent = useCallback(
    (data: { message: MessageWithAttachments }) => {
      queryClient.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return [data.message]
        if (old.some((m) => m.id === data.message.id)) return old
        return [...old, data.message]
      })
    },
    [ticketId, queryClient],
  )

  const handleReconnectSync = useCallback(
    (data: { messages: MessageWithAttachments[] }) => {
      queryClient.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return data.messages
        const existingIds = new Set(old.map((m) => m.id))
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id))
        if (newMsgs.length === 0) return old
        return [...old, ...newMsgs].toSorted((a, b) => a.createdAt - b.createdAt)
      })
    },
    [ticketId, queryClient],
  )

  useEffect(() => {
    if (!ticketId) return

    const socket = connectSocket()

    socket.emit('join:ticket', { ticketId })

    socket.on('message:sent', handleMessageSent)
    socket.on('reconnect:sync', handleReconnectSync)

    socket.on('connect', () => {
      const cached = queryClient.getQueryData<MessageWithAttachments[]>(['messages', ticketId])
      if (cached && cached.length > 0) {
        const lastTimestamp = cached[cached.length - 1].createdAt
        socket.emit('reconnect:sync', { ticketId, lastMessageTimestamp: lastTimestamp })
      }
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    return () => {
      socket.off('message:sent', handleMessageSent)
      socket.off('reconnect:sync', handleReconnectSync)
      socket.off('connect')
      socket.off('connect_error')
      socket.emit('leave:ticket', { ticketId })
    }
  }, [ticketId, handleMessageSent, handleReconnectSync, queryClient])

  return query
}

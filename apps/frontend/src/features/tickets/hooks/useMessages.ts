import { useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Message } from '@repo/shared'

import { fetchMessages } from '@/lib/api/messages'
import { connectSocket } from '@/lib/socket'

export function useMessages(ticketId: number) {
  const queryClient = useQueryClient()

  const query = useQuery<Message[]>({
    queryKey: ['messages', ticketId],
    queryFn: () => fetchMessages(ticketId),
    enabled: !!ticketId,
  })

  const handleMessageSent = useCallback(
    (data: { message: Message }) => {
      queryClient.setQueryData<Message[]>(['messages', ticketId], (old) => {
        if (!old) return [data.message]
        if (old.some((m) => m.id === data.message.id)) return old
        return [...old, data.message]
      })
    },
    [ticketId, queryClient],
  )

  useEffect(() => {
    if (!ticketId) return

    const socket = connectSocket()

    socket.emit('join:ticket', { ticketId })

    socket.on('message:sent', handleMessageSent)
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    return () => {
      socket.off('message:sent', handleMessageSent)
      socket.off('connect_error')
      socket.emit('leave:ticket', { ticketId })
    }
  }, [ticketId, handleMessageSent])

  return query
}

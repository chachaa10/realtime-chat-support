import { useMutation, useQueryClient } from '@tanstack/react-query'

import { sendMessage } from '@/lib/api/messages'

export function useSendMessage(ticketId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendMessage(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', ticketId] })
    },
  })
}

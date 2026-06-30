import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sendMessage } from '@/lib/api/messages'

export function useSendMessage(ticketId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, attachmentIds }: { body: string; attachmentIds?: number[] }) =>
      sendMessage(ticketId, body, attachmentIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', ticketId] })
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Failed to send message')
    },
  })
}

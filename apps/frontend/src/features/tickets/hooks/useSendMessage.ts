import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/context';
import { sendMessage, type MessageWithAttachments } from '@/lib/api/messages';

export function useSendMessage(ticketId: number) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ body, attachmentIds }: { body: string; attachmentIds?: number[] }) =>
      sendMessage(ticketId, body, attachmentIds),
    onMutate: async ({ body }) => {
      const tempId = -Date.now();
      const temp: MessageWithAttachments = {
        id: tempId,
        ticketId,
        authorId: user?.id ?? '',
        authorName: user?.name ?? '',
        body,
        status: 'sending',
        createdAt: Date.now(),
        attachments: [],
      };
      qc.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return [temp];
        return [...old, temp];
      });
      return { tempId };
    },
    onError: (err: Error, _vars, ctx) => {
      qc.setQueryData<MessageWithAttachments[]>(['messages', ticketId], (old) => {
        if (!old) return old;
        return old.map((m) =>
          m.id === ctx?.tempId ? { ...m, status: 'error' as MessageWithAttachments['status'] } : m,
        );
      });
      toast.error(err.message ?? 'Failed to send message');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages', ticketId] });
    },
  });
}
